import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Datadog MCP Server with IPv4 fix...\n');

const serverPath = join(__dirname, 'dist', 'index.js');
const mcpProcess = spawn('node', [serverPath], {
  env: {
    ...process.env,
    DD_API_KEY: '944e0cedc267ca157830fd5f46c5a558',
    DD_APP_KEY: '33eb23f51a2e2e53ceed890781b4768e97ee4a34',
    DD_SITE: 'datadoghq.com'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

mcpProcess.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Check if we have complete JSON-RPC message
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        if (response.result) {
          console.log('✅ MCP Server Response:', JSON.stringify(response, null, 2).substring(0, 500));
          mcpProcess.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not JSON yet
      }
    }
  }
  responseBuffer = lines[lines.length - 1];
});

mcpProcess.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
    console.error('❌ Still getting timeout errors:', msg.substring(0, 200));
    mcpProcess.kill();
    process.exit(1);
  }
});

mcpProcess.on('close', (code) => {
  console.log(`MCP process exited with code ${code}`);
});

// Send aggregate-logs request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'aggregate-logs',
    arguments: {
      filter: {
        query: 'service:gray-eagle-api status:error',
        from: 'now-1h',
        to: 'now'
      },
      compute: [{ aggregation: 'count' }],
      groupBy: [{
        facet: '@error.message',
        limit: 10,
        sort: { type: 'measure', aggregation: 'count', order: 'desc' }
      }]
    }
  }
};

setTimeout(() => {
  console.log('📤 Sending aggregate-logs request...');
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

setTimeout(() => {
  console.error('❌ Timeout waiting for response');
  mcpProcess.kill();
  process.exit(1);
}, 15000);
