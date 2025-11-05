# Datadog MCP Server - Usage Examples

This document provides comprehensive examples for using the Datadog MCP Server APIs, especially for log querying and filtering.

## Table of Contents

- [Logs API Examples](#logs-api-examples)
- [Metrics API Examples](#metrics-api-examples)
- [Monitors API Examples](#monitors-api-examples)
- [Events API Examples](#events-api-examples)
- [Dashboards API Examples](#dashboards-api-examples)

---

## Logs API Examples

### 1. Search All Recent Logs

Get the most recent logs from the last 15 minutes:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-15m",
      "to": "now",
      "query": "*"
    },
    "page": {
      "limit": 50
    },
    "sort": "-timestamp"
  }
}
```

**Response structure:**
```json
{
  "data": [
    {
      "id": "log-id",
      "type": "log",
      "attributes": {
        "timestamp": "2024-01-15T10:30:00Z",
        "status": "info",
        "service": "web-api",
        "message": "Request processed successfully",
        "host": "server-01",
        "tags": ["env:production", "version:1.0"]
      }
    }
  ],
  "meta": {
    "page": {
      "after": "cursor-string"
    }
  }
}
```

### 2. Search for Error Logs Only

Filter logs by status to show only errors:

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
      "limit": 100
    },
    "sort": "-timestamp"
  }
}
```

### 3. Search for Specific Service Errors

Get errors from a specific service:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-6h",
      "to": "now",
      "query": "service:payment-api status:error"
    },
    "page": {
      "limit": 50
    }
  }
}
```

### 4. Text Search in Log Messages

Search for specific text within log messages:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "@message:*timeout* OR @message:*connection*"
    },
    "page": {
      "limit": 50
    }
  }
}
```

### 5. Complex Query with Multiple Conditions

Combine multiple filters:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-24h",
      "to": "now",
      "query": "service:api status:error env:production @http.status_code:>=500"
    },
    "page": {
      "limit": 100
    },
    "sort": "-timestamp"
  }
}
```

### 6. Search by Specific Attribute

Query logs by custom attributes:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "@user_id:12345 @action:login"
    },
    "page": {
      "limit": 20
    }
  }
}
```

### 7. Search with Wildcard Patterns

Use wildcards for flexible matching:

```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-30m",
      "to": "now",
      "query": "host:web-* service:api-* status:(error OR warn)"
    },
    "page": {
      "limit": 50
    }
  }
}
```

### 8. Paginated Log Search

Retrieve logs in pages using cursor:

**First page:**
```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "*"
    },
    "page": {
      "limit": 100
    }
  }
}
```

**Next page (using cursor from previous response):**
```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "*"
    },
    "page": {
      "limit": 100,
      "cursor": "cursor-from-previous-response"
    }
  }
}
```

---

## Log Aggregation Examples

### 1. Count Logs by Status

Get the count of logs grouped by status:

```json
{
  "name": "aggregate-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "*"
    },
    "compute": [
      {
        "aggregation": "count"
      }
    ],
    "groupBy": [
      {
        "facet": "status",
        "limit": 10,
        "sort": {
          "type": "measure",
          "aggregation": "count",
          "order": "desc"
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "data": {
    "buckets": [
      {
        "by": {
          "@status": "info"
        },
        "computes": {
          "c0": 1500
        }
      },
      {
        "by": {
          "@status": "error"
        },
        "computes": {
          "c0": 45
        }
      }
    ]
  }
}
```

### 2. Count Errors by Service

Find which services have the most errors:

```json
{
  "name": "aggregate-logs",
  "arguments": {
    "filter": {
      "from": "now-6h",
      "to": "now",
      "query": "status:error"
    },
    "compute": [
      {
        "aggregation": "count"
      }
    ],
    "groupBy": [
      {
        "facet": "service",
        "limit": 20,
        "sort": {
          "type": "measure",
          "aggregation": "count",
          "order": "desc"
        }
      }
    ]
  }
}
```

### 3. Average Response Time by Endpoint

Calculate average response times:

```json
{
  "name": "aggregate-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "service:web-api"
    },
    "compute": [
      {
        "aggregation": "avg",
        "metric": "@http.response_time"
      }
    ],
    "groupBy": [
      {
        "facet": "http.url_details.path",
        "limit": 10,
        "sort": {
          "type": "measure",
          "aggregation": "avg",
          "order": "desc"
        }
      }
    ]
  }
}
```

---

## Query Syntax Reference

### Status Filters
- `status:info` - Info level logs
- `status:error` - Error logs
- `status:warn` - Warning logs
- `status:(error OR warn)` - Errors or warnings

### Service Filters
- `service:api` - Specific service
- `service:web-*` - Services matching pattern
- `-service:internal` - Exclude service

### Attribute Filters
- `@attribute:value` - Exact match
- `@attribute:*partial*` - Contains
- `@attribute:>=100` - Numeric comparison
- `@attribute:[10 TO 100]` - Range

### Time Ranges
- `now-15m` - 15 minutes ago
- `now-1h` - 1 hour ago
- `now-24h` or `now-1d` - 1 day ago
- `now-7d` - 7 days ago

### Logical Operators
- `AND` - Both conditions (default)
- `OR` - Either condition
- `NOT` or `-` - Exclude

### Examples:
- `service:api AND status:error`
- `status:error OR status:warn`
- `service:api NOT env:development`
- `@user_id:* AND NOT @user_id:anonymous`

---

## Metrics API Examples

### 1. List All System Metrics

```json
{
  "name": "get-metrics",
  "arguments": {
    "q": "system"
  }
}
```

### 2. Search for Custom Metrics

```json
{
  "name": "get-metrics",
  "arguments": {
    "q": "custom.application"
  }
}
```

### 3. Get Metric Metadata

```json
{
  "name": "get-metric-metadata",
  "arguments": {
    "metricName": "system.cpu.user"
  }
}
```

---

## Monitors API Examples

### 1. List All Monitors

```json
{
  "name": "get-monitors",
  "arguments": {
    "limit": 100
  }
}
```

### 2. List Monitors in Alert State

```json
{
  "name": "get-monitors",
  "arguments": {
    "groupStates": ["alert"],
    "limit": 50
  }
}
```

### 3. List Monitors by Tag

```json
{
  "name": "get-monitors",
  "arguments": {
    "monitorTags": "env:production",
    "limit": 100
  }
}
```

### 4. Get Specific Monitor Details

```json
{
  "name": "get-monitor",
  "arguments": {
    "monitorId": 12345678
  }
}
```

---

## Events API Examples

### 1. Get Recent Events (Last Hour)

```json
{
  "name": "get-events",
  "arguments": {
    "start": 1699000000,
    "end": 1699003600,
    "limit": 50
  }
}
```

**Note:** Use Unix timestamps (seconds since epoch). You can calculate:
- Last hour: `Math.floor(Date.now() / 1000) - 3600`
- Current time: `Math.floor(Date.now() / 1000)`

### 2. Filter Events by Source

```json
{
  "name": "get-events",
  "arguments": {
    "start": 1699000000,
    "end": 1699003600,
    "sources": "jenkins,github",
    "limit": 100
  }
}
```

### 3. Filter Events by Priority

```json
{
  "name": "get-events",
  "arguments": {
    "start": 1699000000,
    "end": 1699003600,
    "priority": "low",
    "limit": 50
  }
}
```

---

## Dashboards API Examples

### 1. List All Dashboards

```json
{
  "name": "get-dashboards",
  "arguments": {
    "limit": 100
  }
}
```

### 2. Get Specific Dashboard

```json
{
  "name": "get-dashboard",
  "arguments": {
    "dashboardId": "abc-def-ghi"
  }
}
```

---

## Incidents API Examples

### 1. List Active Incidents

```json
{
  "name": "get-incidents",
  "arguments": {
    "includeArchived": false,
    "pageSize": 50
  }
}
```

### 2. Search Incidents by Query

```json
{
  "name": "get-incidents",
  "arguments": {
    "query": "state:active severity:high",
    "pageSize": 20
  }
}
```

---

## Tips and Best Practices

### 1. Time Range Best Practices
- Start with shorter time ranges (15m-1h) for faster queries
- Use longer ranges (24h-7d) only when necessary
- Always specify both `from` and `to` for predictable results

### 2. Pagination
- Use `limit` to control result size
- For large result sets, use cursor-based pagination
- Save the cursor from `meta.page.after` for next page

### 3. Performance Optimization
- Add specific filters to reduce result set
- Use indexes parameter if you know which indexes to search
- Be as specific as possible with queries

### 4. Query Building
- Start simple, then add filters
- Test queries in Datadog UI first
- Use parentheses for complex boolean logic
- Remember operators must be uppercase (AND, OR, NOT)

### 5. Error Handling
- Check for `data` array in responses
- Handle empty results gracefully
- Verify time ranges are valid
- Ensure proper authentication (403 errors)

---

## Common Use Cases

### Debugging Production Issues
```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-30m",
      "to": "now",
      "query": "env:production status:error @http.status_code:500"
    },
    "page": {"limit": 100},
    "sort": "-timestamp"
  }
}
```

### Monitoring Specific User Journey
```json
{
  "name": "search-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "@user_id:12345 @trace_id:*"
    },
    "sort": "timestamp"
  }
}
```

### Performance Analysis
```json
{
  "name": "aggregate-logs",
  "arguments": {
    "filter": {
      "from": "now-1h",
      "to": "now",
      "query": "service:api"
    },
    "compute": [
      {"aggregation": "avg", "metric": "@duration"},
      {"aggregation": "max", "metric": "@duration"},
      {"aggregation": "count"}
    ],
    "groupBy": [
      {"facet": "@http.url_details.path", "limit": 10}
    ]
  }
}
```

---

For more information, visit the [Datadog API Documentation](https://docs.datadoghq.com/api/).
