import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetMonitorParams = {
  monitorId: number;
};

export const getMonitor = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetMonitorParams) => {
    try {
      const { monitorId } = params;

      const apiUrl = `${getDatadogApiUrl("v1")}/monitor/${monitorId}`;

      const response = await datadogGet(apiUrl);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monitor ${params.monitorId}:`, error);
      throw error;
    }
  }
};
