import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { runDiscoveryAgent, getDiscoveryGreeting, createEmptyDiscoveryState } from '@/lib/agents';
import { isAgenticOnboardingEnabled } from '@/lib/config/feature-flags';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type DbTable = Record<string, unknown>;
interface MockDb {
  contractors: DbTable[];
  businesses: DbTable[];
  conversations: DbTable[];
  projects: DbTable[];
}

class SelectBuilder {
  private filters: Array<[string, unknown]> = [];
  constructor(private table: keyof MockDb, private db: MockDb) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  async single() {
    const rows = this.applyFilters();
    if (rows.length === 0) {
      return { data: null, error: { code: 'PGRST116' } };
    }
    return { data: rows[0], error: null };
  }

  private applyFilters() {
    let rows = [...this.db[this.table]];
    for (const [column, value] of this.filters) {
      rows = rows.filter((row) => row[column] === value);
    }
    return rows;
  }
}

class InsertBuilder {
  private rows: DbTable[];
  constructor(private table: keyof MockDb, private db: MockDb, values: DbTable | DbTable[]) {
    this.rows = Array.isArray(values) ? values : [values];
    this.rows = this.rows.map((row) => {
      if (!row.id) {
        return { ...row, id: crypto.randomUUID() };
      }
      return row;
    });
    this.db[this.table].push(...this.rows);
  }

  select() {
    return this;
  }

  async single() {
    return { data: this.rows[0], error: null };
  }
}

class UpdateBuilder {
  private filters: Array<[string, unknown]> = [];
  private withSelect = false;
  constructor(private table: keyof MockDb, private db: MockDb, private values: DbTable) {}

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  select() {
    this.withSelect = true;
    return this;
  }

  async single() {
    const result = await this.execute();
    return result;
  }

  private async execute() {
    const rows = this.applyFilters();
    rows.forEach((row) => Object.assign(row, this.values));
    return {
      data: this.withSelect ? rows[0] ?? null : null,
      error: rows.length === 0 ? { code: 'PGRST116' } : null,
    };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | Promise<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private applyFilters() {
    let rows = [...this.db[this.table]];
    for (const [column, value] of this.filters) {
      rows = rows.filter((row) => row[column] === value);
    }
    return rows;
  }
}

class TableClient {
  constructor(private table: keyof MockDb, private db: MockDb) {}

  select() {
    return new SelectBuilder(this.table, this.db);
  }

  insert(values: DbTable | DbTable[]) {
    return new InsertBuilder(this.table, this.db, values);
  }

  update(values: DbTable) {
    return new UpdateBuilder(this.table, this.db, values);
  }
}

function createSupabaseMock(db: MockDb, user: { id: string; email: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: user ? null : new Error('no user') }),
    },
    from: (table: keyof MockDb) => new TableClient(table, db),
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/config/feature-flags', () => ({
  isAgenticOnboardingEnabled: vi.fn(),
}));

vi.mock('@/lib/agents', async () => {
  const actual = await vi.importActual<typeof import('@/lib/agents')>('@/lib/agents');
  return {
    ...actual,
    runDiscoveryAgent: vi.fn(),
    getDiscoveryGreeting: vi.fn(),
  };
});

describe('Onboarding API', () => {
  let db: MockDb;

  beforeEach(() => {
    db = {
      contractors: [
        {
          id: 'contractor-1',
          auth_user_id: 'user-1',
          email: 'test@example.com',
          business_name: null,
          city: null,
          state: null,
        },
      ],
      businesses: [],
      conversations: [],
      projects: [],
    };

    const client = createSupabaseMock(db, { id: 'user-1', email: 'test@example.com' });
    const admin = createSupabaseMock(db, { id: 'user-1', email: 'test@example.com' });

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    (isAgenticOnboardingEnabled as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getDiscoveryGreeting as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Hello there');
  });

  it('creates a single onboarding conversation on GET', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isEnabled).toBe(true);
    expect(data.messages.length).toBe(1);
    expect(data.messages[0].content).toBe('Hello there');
    expect(db.conversations.length).toBe(1);
    expect(db.conversations[0].purpose).toBe('onboarding');
  });

  it('appends messages to existing onboarding conversation on POST', async () => {
    const greetingMessage = {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello there',
      created_at: new Date().toISOString(),
    };

    db.businesses.push({
      id: 'contractor-1',
      auth_user_id: 'user-1',
      email: 'test@example.com',
      legacy_contractor_id: 'contractor-1',
    });

    db.conversations.push({
      id: 'conv-1',
      business_id: 'contractor-1',
      purpose: 'onboarding',
      status: 'active',
      messages: [greetingMessage],
      extracted: createEmptyDiscoveryState(),
      summary: null,
    });

    (runDiscoveryAgent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'Thanks! What services do you offer?',
      state: {
        ...createEmptyDiscoveryState(),
        businessName: 'Acme Masonry',
      },
      showSearchResults: false,
      requestedFallback: false,
      isComplete: false,
    });

    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'My business is Acme Masonry' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Thanks! What services do you offer?');
    expect(db.conversations.length).toBe(1);
    expect((db.conversations[0].messages as DbTable[]).length).toBe(3);
    expect(runDiscoveryAgent).toHaveBeenCalledWith(
      'My business is Acme Masonry',
      expect.objectContaining({
        messages: [{ role: 'assistant', content: 'Hello there' }],
      })
    );
  });
});
