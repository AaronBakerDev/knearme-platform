# Troubleshooting

## Tool not showing in ChatGPT

- Confirm the MCP server is reachable over HTTPS.
- Verify the tool definition is returned in the MCP handshake.
- Check that the connector is pointing to the correct `/mcp` endpoint.
- Restart the MCP server and refresh the connector.

## Tool runs but UI does not render

- Confirm the tool includes `openai/outputTemplate` metadata.
- Ensure the UI resource uses `text/html+skybridge`.
- Verify that the UI template URI matches the tool metadata.
- Confirm the widget CSP allows required domains.

## Structured content mismatch

- Validate `structuredContent` against the tool schema.
- Keep `structuredContent` small; move large payloads to `_meta`.

## Widget load errors

- Check the iframe console for blocked network requests.
- Ensure `openai/widgetCSP` includes required domains.
- If you need iframes, add allowed hosts to `frame_domains`.

## Auth issues

- Validate `/.well-known/oauth-protected-resource`.
- Verify OAuth discovery metadata and PKCE S256 support.
- Ensure a 401 with `WWW-Authenticate` is returned when needed.

