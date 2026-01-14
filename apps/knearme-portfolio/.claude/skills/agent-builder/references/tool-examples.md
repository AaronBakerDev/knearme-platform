# Real-World Tool Examples

Comprehensive tool definitions for common agent scenarios.

---

## API Integration Tools

### REST API Tool

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const fetchFromAPI = tool({
  description: 'Fetch data from a REST API endpoint',
  inputSchema: z.object({
    endpoint: z.string().describe('API endpoint path'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    params: z.record(z.string()).optional().describe('Query parameters'),
    body: z.record(z.any()).optional().describe('Request body for POST/PUT'),
  }),
  execute: async ({ endpoint, method, params, body }) => {
    try {
      const url = new URL(endpoint, process.env.API_BASE_URL);
      if (params) {
        Object.entries(params).forEach(([k, v]) =>
          url.searchParams.set(k, v)
        );
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
```

### GraphQL Tool

```typescript
const queryGraphQL = tool({
  description: 'Execute a GraphQL query',
  inputSchema: z.object({
    query: z.string().describe('GraphQL query string'),
    variables: z.record(z.any()).optional().describe('Query variables'),
    operationName: z.string().optional(),
  }),
  execute: async ({ query, variables, operationName }) => {
    try {
      const response = await fetch(process.env.GRAPHQL_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
        body: JSON.stringify({ query, variables, operationName }),
      });

      const result = await response.json();

      if (result.errors) {
        return {
          success: false,
          errors: result.errors.map((e: any) => e.message),
        };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GraphQL error',
      };
    }
  },
});
```

---

## Database Tools

### Supabase Query Tool

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const queryDatabase = tool({
  description: 'Query the database with filters and pagination',
  inputSchema: z.object({
    table: z.string().describe('Table name to query'),
    select: z.string().default('*').describe('Columns to select'),
    filters: z.array(z.object({
      column: z.string(),
      operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in']),
      value: z.any(),
    })).optional(),
    orderBy: z.object({
      column: z.string(),
      ascending: z.boolean().default(true),
    }).optional(),
    limit: z.number().max(100).default(20),
    offset: z.number().default(0),
  }),
  execute: async ({ table, select, filters, orderBy, limit, offset }) => {
    try {
      let query = supabase.from(table).select(select);

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data,
        count,
        pagination: { limit, offset },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
      };
    }
  },
});
```

### Insert/Update Tool

```typescript
const upsertRecord = tool({
  description: 'Insert or update a database record',
  inputSchema: z.object({
    table: z.string(),
    data: z.record(z.any()).describe('Record data to upsert'),
    onConflict: z.string().optional().describe('Column(s) for conflict resolution'),
  }),
  execute: async ({ table, data, onConflict }) => {
    try {
      const query = supabase.from(table).upsert(data, {
        onConflict: onConflict,
      });

      const { data: result, error } = await query.select().single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, record: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upsert failed',
      };
    }
  },
});
```

---

## File System Tools

### Read File Tool

```typescript
import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';

const readFileContent = tool({
  description: 'Read contents of a file',
  inputSchema: z.object({
    path: z.string().describe('Relative path to the file'),
    encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
    maxSize: z.number().default(1024 * 1024).describe('Max file size in bytes'),
  }),
  execute: async ({ path, encoding, maxSize }) => {
    try {
      // Prevent path traversal
      const basePath = process.cwd();
      const fullPath = resolve(basePath, path);
      if (!fullPath.startsWith(basePath)) {
        return { success: false, error: 'Path traversal not allowed' };
      }

      // Check file size
      const stats = await stat(fullPath);
      if (stats.size > maxSize) {
        return {
          success: false,
          error: `File too large: ${stats.size} bytes (max: ${maxSize})`,
        };
      }

      const content = await readFile(fullPath, encoding);

      return {
        success: true,
        content,
        size: stats.size,
        path: fullPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Read failed',
      };
    }
  },
});
```

### Write File Tool

```typescript
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const writeFileContent = tool({
  description: 'Write content to a file',
  inputSchema: z.object({
    path: z.string().describe('Relative path for the file'),
    content: z.string().describe('Content to write'),
    createDirs: z.boolean().default(true).describe('Create parent directories'),
  }),
  execute: async ({ path, content, createDirs }) => {
    try {
      const basePath = process.cwd();
      const fullPath = resolve(basePath, path);
      if (!fullPath.startsWith(basePath)) {
        return { success: false, error: 'Path traversal not allowed' };
      }

      if (createDirs) {
        await mkdir(dirname(fullPath), { recursive: true });
      }

      await writeFile(fullPath, content, 'utf-8');

      return {
        success: true,
        path: fullPath,
        bytesWritten: Buffer.byteLength(content),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Write failed',
      };
    }
  },
});
```

---

## Search & Retrieval Tools

### Vector Search Tool

```typescript
const vectorSearch = tool({
  description: 'Search for similar documents using vector embeddings',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    collection: z.string().describe('Collection/index to search'),
    topK: z.number().min(1).max(20).default(5),
    threshold: z.number().min(0).max(1).default(0.7),
  }),
  execute: async ({ query, collection, topK, threshold }) => {
    try {
      // Generate embedding for query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: query,
          model: 'text-embedding-3-small',
        }),
      });

      const { data } = await embeddingResponse.json();
      const queryEmbedding = data[0].embedding;

      // Search Supabase with pgvector
      const { data: results, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK,
        collection_name: collection,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        results: results.map((r: any) => ({
          content: r.content,
          metadata: r.metadata,
          similarity: r.similarity,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
});
```

### Web Search Tool

```typescript
const searchWeb = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    numResults: z.number().min(1).max(10).default(5),
    freshness: z.enum(['day', 'week', 'month', 'year']).optional(),
  }),
  execute: async ({ query, numResults, freshness }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        count: numResults.toString(),
        ...(freshness && { freshness }),
      });

      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${params}`,
        {
          headers: {
            'X-Subscription-Token': process.env.BRAVE_API_KEY!,
          },
        }
      );

      const data = await response.json();

      return {
        success: true,
        results: data.web.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
});
```

---

## Communication Tools

### Send Email Tool

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = tool({
  description: 'Send an email notification',
  inputSchema: z.object({
    to: z.array(z.string().email()).describe('Recipient email addresses'),
    subject: z.string().max(200).describe('Email subject'),
    body: z.string().describe('Email body (HTML supported)'),
    replyTo: z.string().email().optional(),
  }),
  execute: async ({ to, subject, body, replyTo }) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Agent <agent@example.com>',
        to,
        subject,
        html: body,
        replyTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        messageId: data?.id,
        recipients: to,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email failed',
      };
    }
  },
});
```

### Slack Notification Tool

```typescript
const sendSlackMessage = tool({
  description: 'Send a message to a Slack channel',
  inputSchema: z.object({
    channel: z.string().describe('Channel ID or name'),
    message: z.string().describe('Message text'),
    blocks: z.array(z.any()).optional().describe('Slack Block Kit blocks'),
  }),
  execute: async ({ channel, message, blocks }) => {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          text: message,
          blocks,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        channel: data.channel,
        timestamp: data.ts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Slack error',
      };
    }
  },
});
```

---

## Data Processing Tools

### Transform Data Tool

```typescript
const transformData = tool({
  description: 'Transform data between formats',
  inputSchema: z.object({
    data: z.any().describe('Input data'),
    operations: z.array(z.object({
      type: z.enum(['filter', 'map', 'sort', 'group', 'aggregate']),
      config: z.record(z.any()),
    })).describe('Transformation operations to apply'),
  }),
  execute: async ({ data, operations }) => {
    try {
      let result = Array.isArray(data) ? data : [data];

      for (const op of operations) {
        switch (op.type) {
          case 'filter':
            result = result.filter((item) => {
              const { field, operator, value } = op.config;
              const itemValue = item[field];
              switch (operator) {
                case 'eq': return itemValue === value;
                case 'neq': return itemValue !== value;
                case 'gt': return itemValue > value;
                case 'contains': return itemValue?.includes?.(value);
                default: return true;
              }
            });
            break;

          case 'map':
            const { fields } = op.config;
            result = result.map((item) =>
              fields.reduce((acc: any, f: string) => {
                acc[f] = item[f];
                return acc;
              }, {})
            );
            break;

          case 'sort':
            const { field: sortField, order } = op.config;
            result.sort((a, b) => {
              const cmp = a[sortField] > b[sortField] ? 1 : -1;
              return order === 'desc' ? -cmp : cmp;
            });
            break;

          case 'group':
            const { by } = op.config;
            result = Object.values(
              result.reduce((acc: any, item) => {
                const key = item[by];
                acc[key] = acc[key] || [];
                acc[key].push(item);
                return acc;
              }, {})
            );
            break;
        }
      }

      return {
        success: true,
        data: result,
        count: result.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transform failed',
      };
    }
  },
});
```

---

## Validation Tools

### Schema Validation Tool

```typescript
const validateSchema = tool({
  description: 'Validate data against a JSON schema',
  inputSchema: z.object({
    data: z.any().describe('Data to validate'),
    schema: z.object({
      type: z.enum(['object', 'array', 'string', 'number', 'boolean']),
      properties: z.record(z.any()).optional(),
      required: z.array(z.string()).optional(),
      items: z.any().optional(),
    }).describe('JSON schema definition'),
  }),
  execute: async ({ data, schema }) => {
    const errors: string[] = [];

    function validate(value: any, sch: any, path: string = ''): void {
      // Type check
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (sch.type && actualType !== sch.type) {
        errors.push(`${path}: expected ${sch.type}, got ${actualType}`);
        return;
      }

      // Object properties
      if (sch.type === 'object' && sch.properties) {
        for (const [key, propSchema] of Object.entries(sch.properties)) {
          validate(value?.[key], propSchema, `${path}.${key}`);
        }

        // Required fields
        if (sch.required) {
          for (const req of sch.required) {
            if (value?.[req] === undefined) {
              errors.push(`${path}.${req}: required field missing`);
            }
          }
        }
      }

      // Array items
      if (sch.type === 'array' && sch.items && Array.isArray(value)) {
        value.forEach((item, i) => {
          validate(item, sch.items, `${path}[${i}]`);
        });
      }
    }

    validate(data, schema);

    return {
      valid: errors.length === 0,
      errors,
    };
  },
});
```

---

## Best Practices Summary

1. **Always return objects** - Never return raw strings from tools
2. **Include success flag** - Makes error handling consistent
3. **Descriptive errors** - Help the agent understand what went wrong
4. **Input validation** - Use Zod to prevent invalid inputs
5. **Timeout handling** - Set reasonable timeouts for external calls
6. **Rate limiting** - Implement backoff for API tools
7. **Logging** - Log tool calls for debugging (not in execute)
8. **Security** - Validate paths, sanitize inputs, limit scope
