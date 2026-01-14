# Auth, State, Security

## Authentication

Apps SDK uses OAuth 2.1 with PKCE when user auth is required. ChatGPT acts as the client and discovers your OAuth configuration automatically.

### Required endpoints

1. **Resource metadata**: publish at `/.well-known/oauth-protected-resource` with:
   - `resource`
   - `authorization_servers`
   - `scopes_supported`

2. **Authorization server metadata**: publish OAuth or OIDC discovery with:
   - `authorization_endpoint`, `token_endpoint`
   - `registration_endpoint` (for dynamic client registration)
   - PKCE S256 support in `code_challenge_methods_supported`

### Discovery flow

When a tool requires auth and the user is not signed in, your MCP server should return a `401` with:

```
WWW-Authenticate: Bearer resource_metadata="https://<your-domain>/.well-known/oauth-protected-resource"
```

ChatGPT then discovers your OAuth server and prompts the user to log in.

If the tool requires scopes, include `scope` in the `WWW-Authenticate` header as well.

### Redirect URIs

Allowlist the ChatGPT OAuth redirect URIs in your auth server:

- `https://chatgpt.com/connector_platform_oauth_redirect`
- `https://platform.openai.com/apps-manage/oauth` (used during review)

### Tool security schemes

In each tool definition, set `securitySchemes` to `noauth` or `oauth2`, and include scopes when required.

## State management

Separate state by responsibility:

- **Business data**: stored on the server and fetched by tools.
- **UI state**: stored in `widgetState` for short, model-visible state.
- **Cross-session**: persisted in your backend keyed by user and account.

Guidelines:

- Keep `widgetState` under ~4k tokens.
- Store only ids or small summaries in `widgetState`.
- If the model should reason about images, include `imageId`s in state.
- `widgetState` persists when the user follows up from the widget, but not if they message from the main composer.

## Security and privacy

- Use least privilege and request only required scopes.
- Avoid sending secrets or PII in `structuredContent`.
- Validate all tool inputs server-side.
- Assume tool calls can be replayed; make them idempotent.
- Add explicit confirmation for destructive actions.
- Define a strict widget CSP using `openai/widgetCSP`.
- Do not embed iframes unless allowed in `frame_domains`.
- Avoid collecting location or other restricted data unless absolutely required.
- Widgets cannot access privileged browser APIs like `window.alert`, `window.prompt`, `window.confirm`, or `navigator.clipboard`.
