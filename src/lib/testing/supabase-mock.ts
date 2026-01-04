/**
 * Shared Supabase mock utilities for unit tests.
 *
 * Provides chainable query builders that track filters and allow assertions.
 * Extracted from route.test.ts and enhanced with filter validation.
 *
 * @example
 * ```typescript
 * const db = createMockDb();
 * db.users.push({ id: 'user-1', email: 'test@example.com' });
 * const supabase = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
 * ```
 *
 * @see src/app/api/onboarding/route.test.ts - Original implementation
 * @see https://supabase.com/docs/reference/javascript/select - Supabase query API
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

export type DbRow = Record<string, unknown>;
export type DbTable = DbRow[];

/**
 * Generic mock database structure.
 * Extend this interface for project-specific tables.
 */
export interface MockDb {
  [tableName: string]: DbTable;
}

/**
 * Tracked filter for query assertions.
 */
export interface TrackedFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'not';
  value: unknown;
}

/**
 * Mock user for auth simulation.
 */
export interface MockUser {
  id: string;
  email: string;
}

// =============================================================================
// SelectBuilder - Tracks filters and applies them to mock data
// =============================================================================

export class SelectBuilder<T extends MockDb = MockDb> {
  private filters: TrackedFilter[] = [];
  private selectedColumns: string[] = [];
  private orderColumn: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;

  constructor(
    private tableName: keyof T,
    private db: T
  ) {}

  /**
   * Get all tracked filters for assertions.
   */
  getFilters(): TrackedFilter[] {
    return [...this.filters];
  }

  /**
   * Get selected columns for assertions.
   */
  getSelectedColumns(): string[] {
    return [...this.selectedColumns];
  }

  select(columns?: string) {
    if (columns) {
      this.selectedColumns = columns.split(',').map((c) => c.trim());
    }
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, operator: 'is', value });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.filters.push({ column, operator: 'not', value: { operator, value } });
    return this;
  }

  or(_condition: string) {
    // OR conditions are complex - for now just pass through
    // Real implementation would parse the condition string
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  /**
   * Pagination range (offset and limit).
   */
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  /**
   * Execute query and return single result.
   */
  async single(): Promise<{ data: DbRow | null; error: { code: string } | null }> {
    const rows = this.applyFilters();
    if (rows.length === 0) {
      return { data: null, error: { code: 'PGRST116' } };
    }
    return { data: rows[0] ?? null, error: null };
  }

  /**
   * Execute query and return first result (no error if not found).
   */
  async maybeSingle(): Promise<{ data: DbRow | null; error: null }> {
    const rows = this.applyFilters();
    return { data: rows[0] ?? null, error: null };
  }

  /**
   * Execute query and return all matching rows.
   */
  async then<TResult = { data: DbRow[]; error: null }>(
    onfulfilled?: (value: { data: DbRow[]; error: null }) => TResult | Promise<TResult>
  ): Promise<TResult> {
    const rows = this.applyFilters();
    const result = { data: rows, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }

  private applyFilters(): DbRow[] {
    let rows = [...(this.db[this.tableName] as DbTable)];

    for (const filter of this.filters) {
      rows = rows.filter((row) => {
        const value = row[filter.column];
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'gt':
            return (value as number) > (filter.value as number);
          case 'lt':
            return (value as number) < (filter.value as number);
          case 'gte':
            return (value as number) >= (filter.value as number);
          case 'lte':
            return (value as number) <= (filter.value as number);
          case 'in':
            return (filter.value as unknown[]).includes(value);
          case 'is':
            return value === filter.value;
          default:
            return true;
        }
      });
    }

    if (this.orderColumn) {
      rows.sort((a, b) => {
        const aVal = a[this.orderColumn!] as string | number | null;
        const bVal = b[this.orderColumn!] as string | number | null;
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return this.orderAscending ? 1 : -1;
        if (bVal == null) return this.orderAscending ? -1 : 1;
        if (aVal < bVal) return this.orderAscending ? -1 : 1;
        if (aVal > bVal) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    // Apply range (pagination)
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    }

    return rows;
  }
}

// =============================================================================
// InsertBuilder - Tracks inserted rows
// =============================================================================

export class InsertBuilder<T extends MockDb = MockDb> {
  private rows: DbRow[];

  constructor(
    private tableName: keyof T,
    private db: T,
    values: DbRow | DbRow[]
  ) {
    this.rows = Array.isArray(values) ? values : [values];
    // Auto-generate IDs if missing
    this.rows = this.rows.map((row) => {
      if (!row.id) {
        return { ...row, id: crypto.randomUUID() };
      }
      return row;
    });
    // Actually insert into mock db
    (this.db[this.tableName] as DbTable).push(...this.rows);
  }

  /**
   * Get inserted rows for assertions.
   */
  getInsertedRows(): DbRow[] {
    return [...this.rows];
  }

  select() {
    return this;
  }

  async single(): Promise<{ data: DbRow | null; error: null }> {
    return { data: this.rows[0] ?? null, error: null };
  }

  async then<TResult = { data: DbRow[]; error: null }>(
    onfulfilled?: (value: { data: DbRow[]; error: null }) => TResult | Promise<TResult>
  ): Promise<TResult> {
    const result = { data: this.rows, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }
}

// =============================================================================
// UpdateBuilder - Tracks updates with thenable support
// =============================================================================

export class UpdateBuilder<T extends MockDb = MockDb> {
  private filters: TrackedFilter[] = [];
  private withSelect = false;

  constructor(
    private tableName: keyof T,
    private db: T,
    private values: DbRow
  ) {}

  /**
   * Get tracked filters for assertions.
   */
  getFilters(): TrackedFilter[] {
    return [...this.filters];
  }

  /**
   * Get update values for assertions.
   */
  getUpdateValues(): DbRow {
    return { ...this.values };
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  select() {
    this.withSelect = true;
    return this;
  }

  async single(): Promise<{ data: DbRow | null; error: { code: string } | null }> {
    const result = await this.execute();
    return result;
  }

  private async execute(): Promise<{ data: DbRow | null; error: { code: string } | null }> {
    const rows = this.applyFilters();
    rows.forEach((row) => Object.assign(row, this.values));
    return {
      data: this.withSelect ? rows[0] ?? null : null,
      error: rows.length === 0 ? { code: 'PGRST116' } : null,
    };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: DbRow | null; error: unknown }) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | Promise<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private applyFilters(): DbRow[] {
    let rows = [...(this.db[this.tableName] as DbTable)];
    for (const filter of this.filters) {
      if (filter.operator === 'eq') {
        rows = rows.filter((row) => row[filter.column] === filter.value);
      } else if (filter.operator === 'neq') {
        rows = rows.filter((row) => row[filter.column] !== filter.value);
      }
    }
    return rows;
  }
}

// =============================================================================
// DeleteBuilder - Tracks deletions
// =============================================================================

export class DeleteBuilder<T extends MockDb = MockDb> {
  private filters: TrackedFilter[] = [];

  constructor(
    private tableName: keyof T,
    private db: T
  ) {}

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  async then<TResult = { data: null; error: null }>(
    onfulfilled?: (value: { data: null; error: null }) => TResult | Promise<TResult>
  ): Promise<TResult> {
    // Remove matching rows from db
    const table = this.db[this.tableName] as DbTable;
    for (let i = table.length - 1; i >= 0; i--) {
      const row = table[i];
      if (!row) continue;
      const matches = this.filters.every((f) => row[f.column] === f.value);
      if (matches) {
        table.splice(i, 1);
      }
    }
    const result = { data: null, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }
}

// =============================================================================
// TableClient - Routes to appropriate builder
// =============================================================================

export class TableClient<T extends MockDb = MockDb> {
  constructor(
    private tableName: keyof T,
    private db: T
  ) {}

  select(columns?: string) {
    return new SelectBuilder(this.tableName, this.db).select(columns);
  }

  insert(values: DbRow | DbRow[]) {
    return new InsertBuilder(this.tableName, this.db, values);
  }

  update(values: DbRow) {
    return new UpdateBuilder(this.tableName, this.db, values);
  }

  delete() {
    return new DeleteBuilder(this.tableName, this.db);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a mock Supabase client with in-memory database.
 *
 * @param db - Mock database with table arrays
 * @param user - Mock authenticated user (null for unauthenticated)
 * @returns Mock Supabase client
 *
 * @example
 * ```typescript
 * const db = { users: [], projects: [] };
 * const supabase = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
 *
 * // Use like real Supabase client
 * const { data } = await supabase.from('users').select().eq('id', 'user-1').single();
 * ```
 */
export function createMockSupabase<T extends MockDb>(db: T, user: MockUser | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : new Error('no user'),
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user, session: user ? { access_token: 'mock-token' } : null },
        error: user ? null : new Error('Invalid credentials'),
      }),
    },
    from: (tableName: keyof T) => new TableClient(tableName, db),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock-url.com' } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed-url.com' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };
}

/**
 * Create an empty mock database with common tables.
 * Extend as needed for specific tests.
 */
export function createMockDb(): {
  contractors: DbTable;
  businesses: DbTable;
  projects: DbTable;
  conversations: DbTable;
  project_images: DbTable;
} {
  return {
    contractors: [],
    businesses: [],
    projects: [],
    conversations: [],
    project_images: [],
  };
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert that a specific filter was applied.
 *
 * @example
 * ```typescript
 * const builder = supabase.from('users').select().eq('id', 'user-1');
 * assertFilter(builder, 'id', 'eq', 'user-1');
 * ```
 */
export function assertFilter(
  builder: SelectBuilder | UpdateBuilder,
  column: string,
  operator: TrackedFilter['operator'],
  value: unknown
): void {
  const filters = builder.getFilters();
  const found = filters.find((f) => f.column === column && f.operator === operator && f.value === value);
  if (!found) {
    throw new Error(
      `Expected filter ${column} ${operator} ${JSON.stringify(value)} not found. ` +
        `Actual filters: ${JSON.stringify(filters)}`
    );
  }
}

/**
 * Assert that a filter was NOT applied.
 */
export function assertNoFilter(builder: SelectBuilder | UpdateBuilder, column: string): void {
  const filters = builder.getFilters();
  const found = filters.find((f) => f.column === column);
  if (found) {
    throw new Error(`Unexpected filter on ${column} found: ${JSON.stringify(found)}`);
  }
}

/**
 * Assert specific columns were selected.
 */
export function assertSelectedColumns(builder: SelectBuilder, expectedColumns: string[]): void {
  const selected = builder.getSelectedColumns();
  const missing = expectedColumns.filter((c) => !selected.includes(c));
  if (missing.length > 0) {
    throw new Error(`Expected columns ${missing.join(', ')} not selected. Actual: ${selected.join(', ')}`);
  }
}
