export const API_CONVENTIONS_DESCRIPTION = `
Blog backend HTTP API.

## Response shape
- Single resources: \`{ "data": { ... } }\`
- Collections: \`{ "data": [ ... ], "meta": { "total", "page", "limit" } }\`
- Errors: \`{ "statusCode", "message", "errorCode", "correlationId" }\`

## Pagination
- Query params: \`page\` (default 1), \`limit\` (default 20, max 100)
- Response \`meta\` includes \`total\`, \`page\`, \`limit\`

## Sorting
- Query param: \`sort=field:asc|desc\` (example: \`sort=createdAt:desc\`)

## Filtering
- Posts: \`published=true|false\`
- Posts by tag: \`tagSlug=nestjs\` (Phase 6)

## Frontend integration
- Generate client types from \`GET /v1/docs-json\` (openapi-typescript, Orval, etc.)
- Optionally pin releases using a committed \`openapi.json\` snapshot on tags
`.trim();
