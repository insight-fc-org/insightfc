import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { FixturesGet } from './schemas.js';
import { fixturesGet } from './mock.js';

// Register one tool: fixtures_get
const tools = {
  fixtures_get: {
    description: 'Get mock fixtures for a league',
    schema: FixturesGet,
    handler: fixturesGet
  }
} as const;

const server = new Server(
  { name: 'mcp-football-mock', version: '0.0.1' },
  { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, t]) => ({
    name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.schema) as any
  }))
}));

// Call tool
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: raw } = req.params;
  const tool = (tools as any)[name];
  if (!tool) throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);

  const parsed = tool.schema.safeParse(raw || {});
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, JSON.stringify(parsed.error.issues));
  }

  const data = await tool.handler(parsed.data);
  return { content: [{ type: 'json', json: data }] };
});

// Wire stdio transport
const transport = new StdioServerTransport();
server.connect(transport);
console.log('MCP mock server started (stdio)');