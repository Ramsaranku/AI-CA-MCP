import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const mcpTransport = new Experimental_StdioMCPTransport({
    command: 'node',
    args: ['C:/Users/saran/OneDrive/Desktop/projects/AI-CA-MCP/cricket-mcp/cricket-mcp/dist/index.js'],
  });

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    messages,
    tools: await mcpTransport.getTools(),
  });

  return result.toDataStreamResponse();
}