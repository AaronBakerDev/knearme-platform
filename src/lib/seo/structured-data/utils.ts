/**
 * Stringify schema for embedding in HTML.
 */
export function schemaToString(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 0)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
