import { datadogPost, getDatadogApiUrl } from "../utils/httpClient";

type SearchLogsParams = {
  filter?: {
    query?: string;
    from?: string;
    to?: string;
    indexes?: string[];
  };
  sort?: string;
  page?: {
    limit?: number;
    cursor?: string;
  };
  limit?: number;
  apiKey?: string;
  appKey?: string;
};

export const searchLogs = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: SearchLogsParams) => {
    try {
      const {
        apiKey = process.env.DD_API_KEY,
        appKey = process.env.DD_APP_KEY,
        filter,
        sort,
        page,
        limit
      } = params;

      if (!apiKey || !appKey) {
        throw new Error("API Key and App Key are required");
      }

      const body = {
        filter: filter,
        sort: sort,
        page: page
      };

      const apiUrl = `${getDatadogApiUrl("v2")}/logs/events/search`;

      const response = await datadogPost(apiUrl, body, {
        headers: {
          "DD-API-KEY": apiKey,
          "DD-APPLICATION-KEY": appKey
        }
      });

      const data = response.data;

      // Apply client-side limit if specified
      if (limit && data.data && data.data.length > limit) {
        data.data = data.data.slice(0, limit);
      }

      return data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error(
          "Authorization failed (403 Forbidden): Check that your API key and Application key are valid and have sufficient permissions to access logs."
        );
        throw new Error(
          "Datadog API authorization failed. Please verify your API and Application keys have the correct permissions."
        );
      } else {
        const errorMsg = error.response?.data?.errors?.[0] || error.message || String(error);
        console.error("Error searching logs:", errorMsg, "Full error:", error);
        throw new Error(errorMsg);
      }
    }
  }
};
