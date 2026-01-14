import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeHref } from './html';

describe('escapeHtml', () => {
  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<script>alert(\"x\") & test</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;) &amp; test&lt;/script&gt;'
    );
  });

  it('returns the same string when no escaping is needed', () => {
    expect(escapeHtml('Plain text')).toBe('Plain text');
  });
});

describe('sanitizeHref', () => {
  it('allows http, https, mailto, and tel URLs', () => {
    expect(sanitizeHref('https://example.com')).toBe('https://example.com');
    expect(sanitizeHref('http://example.com')).toBe('http://example.com');
    expect(sanitizeHref('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeHref('tel:+18005551212')).toBe('tel:+18005551212');
  });

  it('allows relative and fragment links', () => {
    expect(sanitizeHref('/blog/post')).toBe('/blog/post');
    expect(sanitizeHref('blog/post')).toBe('blog/post');
    expect(sanitizeHref('#section')).toBe('#section');
  });

  it('blocks javascript and data URLs', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBe('#');
    expect(sanitizeHref('data:text/html;base64,PHNjcmlwdD4=')).toBe('#');
  });
});
