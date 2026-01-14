import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/transcription';

type DbTable = Record<string, unknown>;
interface MockDb {
  contractors: DbTable[];
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

class TableClient {
  constructor(private table: keyof MockDb, private db: MockDb) {}

  select() {
    return new SelectBuilder(this.table, this.db);
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
}));

vi.mock('@/lib/ai/transcription', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/transcription')>(
    '@/lib/ai/transcription'
  );
  return {
    ...actual,
    transcribeAudio: vi.fn(),
  };
});

describe('Transcription API', () => {
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
        },
      ],
      projects: [],
    };

    const client = createSupabaseMock(db, { id: 'user-1', email: 'test@example.com' });
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
    (transcribeAudio as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: 'we fixed it',
    });
  });

  it('allows transcription with incomplete profiles', async () => {
    // Create a mock audio file that meets minimum size requirement (1000 bytes)
    const audioData = new Uint8Array(1024).fill(0);
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', file);

    const request = new Request('http://localhost/api/ai/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.text).toBe('We fixed it');
    expect(transcribeAudio).toHaveBeenCalledTimes(1);
  });

  it('returns unauthorized when no user session is present', async () => {
    const client = createSupabaseMock(db, null);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(client);

    // Create a mock audio file that meets minimum size requirement (1000 bytes)
    const audioData = new Uint8Array(1024).fill(0);
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', file);

    const request = new Request('http://localhost/api/ai/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error?.code).toBe('UNAUTHORIZED');
  });
});
