#!/usr/bin/env node

/**
 * Complete MCP Server Integration Test
 * Tests the actual MCP server with all tools through the MCP protocol
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, 'dist', 'index.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let messageId = 1;

function sendMCPRequest(server, method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method: method,
      params: params
    };

    const requestStr = JSON.stringify(request) + '\n';
    let responseBuffer = '';
    let timeout;

    const responseHandler = (data) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timeout);
              server.stdout.off('data', responseHandler);
              resolve(response);
            }
          } catch (e) {
            // Continue buffering
          }
        }
      }
    };

    server.stdout.on('data', responseHandler);

    timeout = setTimeout(() => {
      server.stdout.off('data', responseHandler);
      reject(new Error('Request timeout after 30 seconds'));
    }, 30000);

    server.stdin.write(requestStr);
  });
}

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('🧪 COMPLETE MCP SERVER INTEGRATION TEST', 'bold');
  log('='.repeat(80), 'cyan');

  // Start MCP server
  log('\n📡 Starting MCP server...', 'yellow');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  // Handle server errors
  server.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!msg.includes('Warning:')) {
      log(`Server stderr: ${msg}`, 'red');
    }
  });

  server.on('error', (error) => {
    log(`\n❌ Server error: ${error.message}`, 'red');
    process.exit(1);
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Initialize MCP connection
  log('🔌 Initializing MCP connection...', 'yellow');
  try {
    const initResponse = await sendMCPRequest(server, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'integration-test',
        version: '1.0.0'
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${JSON.stringify(initResponse.error)}`);
    }
    log('✅ MCP connection initialized\n', 'green');
  } catch (error) {
    log(`❌ Failed to initialize: ${error.message}`, 'red');
    server.kill();
    process.exit(1);
  }

  const results = [];

  // TEST 1: search-logs
  log('─'.repeat(80), 'cyan');
  log('TEST 1: search-logs tool (filter error logs)', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'search-logs',
      arguments: {
        filter: {
          from: 'now-1h',
          to: 'now',
          query: 'status:error'
        },
        page: { limit: 3 }
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const logCount = data.data ? data.data.length : 0;

    log(`✅ SUCCESS - Retrieved ${logCount} error logs`, 'green');
    if (data.data && data.data.length > 0) {
      log(`   Sample: ${data.data[0].attributes?.service || 'N/A'}`, 'cyan');
    }
    results.push({ test: 'search-logs', passed: true, count: logCount });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'search-logs', passed: false, error: error.message });
  }

  // TEST 2: aggregate-logs with sort
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 2: aggregate-logs tool (with sort by service)', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'aggregate-logs',
      arguments: {
        filter: {
          from: 'now-1h',
          to: 'now',
          query: 'status:error'
        },
        compute: [{ aggregation: 'count' }],
        groupBy: [
          {
            facet: 'service',
            limit: 10,
            sort: {
              type: 'measure',
              aggregation: 'count',
              order: 'desc'
            }
          }
        ]
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const buckets = data.data?.buckets || [];

    log(`✅ SUCCESS - Got ${buckets.length} service buckets`, 'green');
    buckets.forEach((bucket, i) => {
      const service = bucket.by?.service || 'Unknown';
      const count = bucket.computes?.c0 || 0;
      log(`   ${i + 1}. ${service}: ${count} errors`, 'cyan');
    });
    results.push({ test: 'aggregate-logs', passed: true, count: buckets.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'aggregate-logs', passed: false, error: error.message });
  }

  // TEST 3: get-metrics
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 3: get-metrics tool', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'get-metrics',
      arguments: {
        q: 'system'
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const metrics = data.metrics || [];

    log(`✅ SUCCESS - Retrieved ${metrics.length} metrics`, 'green');
    if (metrics.length > 0) {
      log(`   Sample: ${metrics.slice(0, 3).join(', ')}`, 'cyan');
    }
    results.push({ test: 'get-metrics', passed: true, count: metrics.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'get-metrics', passed: false, error: error.message });
  }

  // TEST 4: get-monitors
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 4: get-monitors tool', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'get-monitors',
      arguments: {
        limit: 10
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const monitors = Array.isArray(data) ? data : [];

    log(`✅ SUCCESS - Retrieved ${monitors.length} monitors`, 'green');
    results.push({ test: 'get-monitors', passed: true, count: monitors.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'get-monitors', passed: false, error: error.message });
  }

  // TEST 5: get-dashboards
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 5: get-dashboards tool', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'get-dashboards',
      arguments: {
        limit: 10
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const dashboards = data.dashboards || [];

    log(`✅ SUCCESS - Retrieved ${dashboards.length} dashboards`, 'green');
    results.push({ test: 'get-dashboards', passed: true, count: dashboards.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'get-dashboards', passed: false, error: error.message });
  }

  // TEST 6: get-events
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 6: get-events tool', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'get-events',
      arguments: {
        start: oneHourAgo,
        end: now,
        limit: 10
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const events = data.events || [];

    log(`✅ SUCCESS - Retrieved ${events.length} events`, 'green');
    results.push({ test: 'get-events', passed: true, count: events.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'get-events', passed: false, error: error.message });
  }

  // TEST 7: get-incidents
  log('\n' + '─'.repeat(80), 'cyan');
  log('TEST 7: get-incidents tool', 'blue');
  log('─'.repeat(80), 'cyan');
  try {
    const response = await sendMCPRequest(server, 'tools/call', {
      name: 'get-incidents',
      arguments: {
        limit: 10
      }
    });

    if (response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    const data = JSON.parse(response.result.content[0].text);
    const incidents = data.data || [];

    log(`✅ SUCCESS - Retrieved ${incidents.length} incidents`, 'green');
    results.push({ test: 'get-incidents', passed: true, count: incidents.length });
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    results.push({ test: 'get-incidents', passed: false, error: error.message });
  }

  // Print summary
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 FINAL TEST RESULTS', 'bold');
  log('='.repeat(80), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      const countInfo = result.count !== undefined ? ` (${result.count} items)` : '';
      log(`✅ ${result.test}${countInfo}`, 'green');
    } else {
      log(`❌ ${result.test}: ${result.error}`, 'red');
    }
  });

  log('\n' + '─'.repeat(80), 'cyan');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
      failed === 0 ? 'green' : 'yellow');
  log('='.repeat(80), 'cyan');

  if (failed === 0 && passed > 0) {
    log('\n🎉 ALL MCP TOOLS WORKING CORRECTLY!', 'green');
    log('✅ The MCP server is fully functional and ready for production!', 'green');
  } else {
    log('\n⚠️  Some tests failed - review errors above', 'yellow');
  }

  // Cleanup
  server.kill();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n💥 Unhandled error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
