import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetDashboardParams = {
  dashboardId: string;
};

export const getDashboard = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetDashboardParams) => {
    try {
      const { dashboardId } = params;

      const apiUrl = `${getDatadogApiUrl("v1")}/dashboard/${dashboardId}`;

      const response = await datadogGet(apiUrl);
      return response.data;
    } catch (error) {
      console.error(`Error fetching dashboard ${params.dashboardId}:`, error);
      throw error;
    }
  }
};
