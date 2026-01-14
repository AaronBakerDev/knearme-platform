# Deployment and review

## Deploy the MCP server

- Host the server on a public HTTPS domain.
- Ensure the `/mcp` endpoint supports streaming responses.
- Set a strict widget CSP for your UI bundle.

## Connect in ChatGPT (dev mode)

- Enable Developer Mode in ChatGPT.
- Create a connector and point it at your `/mcp` endpoint.
- If you use a tunnel for local dev, refresh the connector after changes.
- ChatGPT apps are supported across plans, but availability can change; check the latest OpenAI docs before launch.

## Testing

- Run golden prompt tests for tool selection.
- Validate tool schemas with the MCP Inspector.
- Test in all display modes used by the UI.
- Exercise sign-in, sign-out, and token refresh flows.

## Submission requirements

- Your OpenAI organization must be verified.
- You must have Owner permissions for the org.
- The server must be publicly accessible (no localhost).
- All required CSP fields must be set.

## Submission review guidelines (summary)

- **Originality and quality**: apps must provide clear user value.
- **Metadata**: app name and description must be accurate and not misleading.
- **Tool design**: names and descriptions must be specific and predictable.
- **Inputs**: request only needed information and avoid unnecessary fields.
- **Safety**: avoid sensitive or restricted data, provide privacy disclosures.
- **Behavior**: tools should behave consistently and avoid surprising changes.
- **Data handling**: disclose data use, minimize retention, and secure storage.

## After approval

- Publishing makes the app discoverable.
- Changes to tool names, descriptions, or auth scopes may require resubmission.
- Monitor logs, error rates, and user feedback closely.
