import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetMetricMetadataParams = {
  metricName: string;
};

export const getMetricMetadata = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetMetricMetadataParams) => {
    try {
      const { metricName } = params;

      const apiUrl = `${getDatadogApiUrl("v1")}/metrics/${encodeURIComponent(metricName)}`;

      const response = await datadogGet(apiUrl);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching metadata for metric ${params.metricName}:`,
        error
      );
      throw error;
    }
  }
};
