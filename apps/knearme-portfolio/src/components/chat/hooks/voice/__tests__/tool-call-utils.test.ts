import { describe, expect, it } from 'vitest';
import { buildToolCallsPayload, buildToolResponses } from '../tool-call-utils';

describe('buildToolCallsPayload', () => {
  it('uses provided ids, names, and args', () => {
    const result = buildToolCallsPayload([
      { id: 'tool-1', name: 'create_project', args: { project_id: 'abc' } },
    ]);

    expect(result).toEqual([
      { id: 'tool-1', name: 'create_project', args: { project_id: 'abc' } },
    ]);
  });

  it('falls back to generated ids and empty args', () => {
    const result = buildToolCallsPayload([
      { name: 'unknown-tool', args: 'not-an-object' },
    ]);

    expect(result[0]?.id).toBe('unknown-tool-0');
    expect(result[0]?.name).toBe('unknown-tool');
    expect(result[0]?.args).toEqual({});
  });
});

describe('buildToolResponses', () => {
  it('maps output results to response payloads', () => {
    const result = buildToolResponses([
      { id: '1', name: 'tool', output: { ok: true } },
    ]);

    expect(result).toEqual([
      { id: '1', name: 'tool', response: { output: { ok: true } } },
    ]);
  });

  it('maps errors to response payloads', () => {
    const result = buildToolResponses([
      { id: '2', name: 'tool', error: { message: 'nope' } },
    ]);

    expect(result).toEqual([
      { id: '2', name: 'tool', response: { error: { message: 'nope' } } },
    ]);
  });
});
