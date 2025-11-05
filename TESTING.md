# Testing the Datadog MCP Server

This guide helps you verify the Datadog MCP Server is working correctly.

## Quick Test

Run this command on your local machine (where you have network access to Datadog):

```bash
# Set your credentials
export DD_API_KEY="your_api_key"
export DD_APP_KEY="your_app_key"
export DD_SITE="datadoghq.com"  # or datadoghq.eu, us5.datadoghq.com, etc.

# Run the test
node test-error-logs.mjs
```

## What the Test Does

The test script performs 3 checks:

### Test 1: Count Total Error Logs
Queries Datadog for the total number of error logs in the last hour.

**Query:** `status:error`

**Expected Output:**
```
📈 RESULT: X ERROR LOGS IN LAST HOUR
```

### Test 2: Retrieve Sample Error Logs
Fetches up to 5 actual error log entries to verify the search API works.

**Expected Output:**
Shows details of each error log including:
- Log ID
- Status
- Service
- Host
- Timestamp
- Message
- Tags

### Test 3: Count Errors by Service
Groups error logs by service to see which services have the most errors.

**Expected Output:**
```
📊 Errors by Service (Top 10):
 1. payment-api             45 ████
 2. web-backend             32 ███
 3. auth-service            12 █
```

## Expected Results

### If Everything Works:
```
✅ VERIFICATION COMPLETE!
🎉 The Datadog Logs API is working correctly!
```

### If No Errors Found:
```
✨ No errors found - your systems are running smoothly!
```
This is actually good news! It means your services haven't logged any errors.

### Common Issues

#### 1. 403 Forbidden
```
❌ HTTP 403 Error
```

**Solution:**
- Verify your API key and App key are correct
- Check that the keys have "Logs Read" permission
- Go to Datadog → Organization Settings → API Keys/Application Keys

#### 2. Network Error
```
❌ fetch failed
```

**Solution:**
- Check your internet connection
- Verify firewall isn't blocking api.datadoghq.com
- Try with a different network

#### 3. Wrong Site
```
❌ HTTP 404 Error
```

**Solution:**
- Verify your DD_SITE matches your Datadog region:
  - US: `datadoghq.com`
  - EU: `datadoghq.eu`
  - US3: `us3.datadoghq.com`
  - US5: `us5.datadoghq.com`
  - AP1: `ap1.datadoghq.com`

## Manual Testing with MCP Inspector

You can also test using the MCP Inspector:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run the server with inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

Then in the inspector, call:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "status:error"
    },
    "page": {
      "limit": 10
    }
  }
}
```

## Testing Different Queries

### Test Error Logs
```bash
# Just run the test script
node test-error-logs.mjs
```

### Test Specific Service
Modify the query in the script to:
```javascript
query: 'service:my-service status:error'
```

### Test Text Search
Modify the query to search for specific text:
```javascript
query: '@message:*timeout* OR @message:*connection*'
```

### Test All Logs (Not Just Errors)
Change the query to:
```javascript
query: '*'  // All logs
```

## Troubleshooting

### No Data Returned

If the API works but returns 0 results:

1. **Check time range:** Try expanding the time range
   ```javascript
   from: 'now-24h',  // Last 24 hours instead of 1 hour
   ```

2. **Check if you have logs:** Visit Datadog UI → Logs → Explorer
   - If you see logs there but not via API, check permissions
   - If you don't see logs at all, your services might not be logging

3. **Verify log indexing:** Logs might not be indexed yet
   - Recent logs take a few minutes to be searchable
   - Try searching for older logs: `from: 'now-2h'`

### SSL Certificate Errors

If you get SSL errors:

```bash
# For testing only, not recommended for production
NODE_TLS_REJECT_UNAUTHORIZED=0 node test-error-logs.mjs
```

Better solution: Update your system's SSL certificates.

## Success Criteria

The MCP server is working correctly if:

✅ Test 1 completes without HTTP errors
✅ Test 2 retrieves log entries (if any exist)
✅ Test 3 shows error distribution (if any errors exist)
✅ All API endpoints return valid JSON responses

## Next Steps

Once testing is successful:

1. ✅ Review EXAMPLES.md for more query patterns
2. ✅ Integrate with Claude Desktop or your application
3. ✅ Set up monitoring for specific error patterns
4. ✅ Create custom dashboards based on log data

## Support

If issues persist:

1. Check the Datadog API status: https://status.datadoghq.com/
2. Review API documentation: https://docs.datadoghq.com/api/latest/logs/
3. Verify your logs are being ingested in the Datadog UI
4. Check the MCP server logs for detailed error messages
