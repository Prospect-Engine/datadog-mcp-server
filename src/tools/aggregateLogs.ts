import { datadogPost, getDatadogApiUrl } from "../utils/httpClient";

type AggregateLogsParams = {
  filter?: {
    query?: string;
    from?: string;
    to?: string;
    indexes?: string[];
  };
  compute?: Array<{
    aggregation: string;
    metric?: string;
    type?: string;
  }>;
  groupBy?: Array<{
    facet: string;
    limit?: number;
    sort?: {
      type?: "measure" | "alphabetical" | "time";
      aggregation?: string;
      order?: string;
    };
  }>;
  options?: {
    timezone?: string;
  };
};

export const aggregateLogs = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: AggregateLogsParams) => {
    try {
      const { filter, compute, groupBy, options } = params;

      const apiUrl = `${getDatadogApiUrl("v2")}/logs/analytics/aggregate`;

      const body = {
        filter: filter,
        compute: compute,
        group_by: groupBy,
        options: options
      };

      const response = await datadogPost(apiUrl, body);

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error(
          "Authorization failed (403 Forbidden): Check that your API key and Application key are valid and have sufficient permissions to access log analytics."
        );
        throw new Error(
          "Datadog API authorization failed. Please verify your API and Application keys have the correct permissions."
        );
      } else {
        console.error("Error aggregating logs:", error.message || error);
        throw new Error(error.response?.data?.errors?.[0] || error.message || "Failed to aggregate logs");
      }
    }
  }
};
