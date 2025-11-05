import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetMetricsParams = {
  q?: string;
};

export const getMetrics = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetMetricsParams) => {
    try {
      const { q } = params;

      const queryStr = q || "*";
      const apiUrl = `${getDatadogApiUrl("v1")}/search?q=${encodeURIComponent(queryStr)}`;

      const response = await datadogGet(apiUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching metrics:", error);
      throw error;
    }
  }
};
