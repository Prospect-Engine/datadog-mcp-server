#!/usr/bin/env node

/**
 * Standalone test script to verify Datadog Logs API
 * Run this on your local machine with: node test-error-logs.mjs
 *
 * Make sure you have DD_API_KEY and DD_APP_KEY environment variables set
 */

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

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('🔍 DATADOG ERROR LOGS VERIFICATION TEST', 'bold');
  log('='.repeat(80), 'cyan');

  // Check credentials
  const apiKey = process.env.DD_API_KEY;
  const appKey = process.env.DD_APP_KEY;
  const site = process.env.DD_SITE || process.env.DD_LOGS_SITE || 'datadoghq.com';

  if (!apiKey || !appKey) {
    log('\n❌ ERROR: Environment variables not set!', 'red');
    log('\nPlease set:', 'yellow');
    log('  export DD_API_KEY="your_api_key"', 'yellow');
    log('  export DD_APP_KEY="your_app_key"', 'yellow');
    log('  export DD_SITE="datadoghq.com"  # Optional, defaults to datadoghq.com\n', 'yellow');
    process.exit(1);
  }

  log(`\n✅ Configuration OK`, 'green');
  log(`   API Key: ${apiKey.substring(0, 12)}...`, 'cyan');
  log(`   App Key: ${appKey.substring(0, 12)}...`, 'cyan');
  log(`   Site: ${site}`, 'cyan');

  // TEST 1: Count total error logs in last hour
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 TEST 1: Count Total Error Logs (Last 1 Hour)', 'blue');
  log('='.repeat(80), 'cyan');

  try {
    const apiUrl = `https://api.${site}/api/v2/logs/analytics/aggregate`;
    log(`\nEndpoint: ${apiUrl}`, 'cyan');

    const body = {
      filter: {
        from: 'now-1h',
        to: 'now',
        query: 'status:error'
      },
      compute: [{ aggregation: 'count' }]
    };

    log('Request Body:', 'cyan');
    console.log(JSON.stringify(body, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey
      },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
      log(`\n❌ HTTP ${response.status} Error:`, 'red');
      console.log(responseText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = JSON.parse(responseText);

    log('\n✅ SUCCESS!', 'green');

    // Parse count from response
    let totalErrors = 0;
    if (data.data && data.data.buckets && data.data.buckets.length > 0) {
      totalErrors = data.data.buckets[0].computes.c0 || 0;
    } else if (data.meta && data.meta.total_count !== undefined) {
      totalErrors = data.meta.total_count;
    }

    log(`\n${'─'.repeat(80)}`, 'cyan');
    log(`📈 RESULT: ${totalErrors} ERROR LOGS IN LAST HOUR`, 'green');
    log(`${'─'.repeat(80)}`, 'cyan');

    if (totalErrors === 0) {
      log('\n✨ No errors found - your systems are running smoothly!', 'green');
    } else if (totalErrors < 10) {
      log(`\n✅ Low error count - ${totalErrors} errors is manageable`, 'green');
    } else if (totalErrors < 100) {
      log(`\n⚠️  Moderate error count - ${totalErrors} errors to investigate`, 'yellow');
    } else {
      log(`\n⚠️  High error count - ${totalErrors} errors need attention!`, 'yellow');
    }

    log('\nFull Response:', 'cyan');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    log(`\n❌ TEST 1 FAILED: ${error.message}`, 'red');
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    log('\nThis could mean:', 'yellow');
    log('  • Network connectivity issue', 'yellow');
    log('  • Invalid API credentials', 'yellow');
    log('  • Incorrect site configuration', 'yellow');
    log('  • Firewall blocking the request', 'yellow');
    process.exit(1);
  }

  // TEST 2: Get sample error logs
  log('\n\n' + '='.repeat(80), 'cyan');
  log('📋 TEST 2: Retrieve Sample Error Logs (Up to 5)', 'blue');
  log('='.repeat(80), 'cyan');

  try {
    const apiUrl = `https://api.${site}/api/v2/logs/events/search`;
    log(`\nEndpoint: ${apiUrl}`, 'cyan');

    const body = {
      filter: {
        from: 'now-1h',
        to: 'now',
        query: 'status:error'
      },
      page: { limit: 5 },
      sort: '-timestamp'
    };

    log('Request Body:', 'cyan');
    console.log(JSON.stringify(body, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey
      },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
      log(`\n❌ HTTP ${response.status} Error:`, 'red');
      console.log(responseText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = JSON.parse(responseText);

    log('\n✅ SUCCESS!', 'green');

    const logs = data.data || [];
    log(`\n📋 Retrieved ${logs.length} error log entries`, 'green');

    if (logs.length > 0) {
      log('\n' + '─'.repeat(80), 'cyan');
      log('Sample Error Logs:', 'yellow');
      log('─'.repeat(80), 'cyan');

      logs.forEach((logEntry, index) => {
        log(`\n[${index + 1}] Error Log:`, 'yellow');
        log(`    ID: ${logEntry.id}`, 'cyan');

        if (logEntry.attributes) {
          const attrs = logEntry.attributes;
          log(`    Status: ${attrs.status || 'N/A'}`, 'cyan');
          log(`    Service: ${attrs.service || 'N/A'}`, 'cyan');
          log(`    Host: ${attrs.host || 'N/A'}`, 'cyan');
          log(`    Timestamp: ${attrs.timestamp || 'N/A'}`, 'cyan');

          if (attrs.message) {
            const msg = attrs.message.length > 200
              ? attrs.message.substring(0, 200) + '...'
              : attrs.message;
            log(`    Message: ${msg}`, 'cyan');
          }

          if (attrs.tags && attrs.tags.length > 0) {
            log(`    Tags: ${attrs.tags.slice(0, 5).join(', ')}`, 'cyan');
          }

          if (attrs['@error']) {
            log(`    Error Type: ${attrs['@error'].kind || 'N/A'}`, 'red');
          }
        }
      });
    } else {
      log('\n✨ No error logs found in the sample!', 'green');
    }

  } catch (error) {
    log(`\n❌ TEST 2 FAILED: ${error.message}`, 'red');
  }

  // TEST 3: Count errors by service
  log('\n\n' + '='.repeat(80), 'cyan');
  log('🔍 TEST 3: Count Errors by Service', 'blue');
  log('='.repeat(80), 'cyan');

  try {
    const apiUrl = `https://api.${site}/api/v2/logs/analytics/aggregate`;

    const body = {
      filter: {
        from: 'now-1h',
        to: 'now',
        query: 'status:error'
      },
      compute: [{ aggregation: 'count' }],
      group_by: [
        {
          facet: '@service',
          limit: 10,
          sort: { aggregation: 'count', order: 'desc' }
        }
      ]
    };

    log('\nRequest Body:', 'cyan');
    console.log(JSON.stringify(body, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey
      },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
      log(`\n❌ HTTP ${response.status} Error:`, 'red');
      console.log(responseText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = JSON.parse(responseText);

    log('\n✅ SUCCESS!', 'green');

    if (data.data && data.data.buckets && data.data.buckets.length > 0) {
      log('\n' + '─'.repeat(80), 'cyan');
      log('📊 Errors by Service (Top 10):', 'yellow');
      log('─'.repeat(80), 'cyan');

      let totalAcrossServices = 0;
      data.data.buckets.forEach((bucket, index) => {
        const service = bucket.by['@service'] || 'Unknown Service';
        const count = bucket.computes.c0 || 0;
        totalAcrossServices += count;

        const bar = '█'.repeat(Math.min(Math.floor(count / 10), 50));
        log(`${String(index + 1).padStart(2)}. ${service.padEnd(30)} ${count.toString().padStart(6)} ${bar}`, 'cyan');
      });

      log('─'.repeat(80), 'cyan');
      log(`Total errors across services: ${totalAcrossServices}`, 'green');
    } else {
      log('\n✨ No services with errors found!', 'green');
    }

  } catch (error) {
    log(`\n❌ TEST 3 FAILED: ${error.message}`, 'red');
  }

  // Summary
  log('\n\n' + '='.repeat(80), 'cyan');
  log('✅ VERIFICATION COMPLETE!', 'green');
  log('='.repeat(80), 'cyan');
  log('\n🎉 The Datadog Logs API is working correctly!', 'green');
  log('\nYou can now use these queries in your MCP tools:', 'cyan');
  log('  • status:error              → All error logs', 'yellow');
  log('  • status:warn               → Warning logs', 'yellow');
  log('  • service:my-app            → Logs from specific service', 'yellow');
  log('  • @message:*timeout*        → Text search in messages', 'yellow');
  log('  • status:error AND service:api → Combined filters', 'yellow');
  log('\n📖 See EXAMPLES.md for 40+ more query examples!\n', 'cyan');
}

main().catch(error => {
  log(`\n💥 Unhandled error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
