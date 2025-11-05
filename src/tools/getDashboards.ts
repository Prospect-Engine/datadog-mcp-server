import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetDashboardsParams = {
  filterConfigured?: boolean;
  limit?: number;
};

export const getDashboards = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetDashboardsParams) => {
    try {
      const { filterConfigured, limit } = params;

      const apiUrl = `${getDatadogApiUrl("v1")}/dashboard`;

      const response = await datadogGet(apiUrl);

      // Apply client-side filtering if specified
      let filteredDashboards = response.data.dashboards || [];

      // Apply client-side limit if specified
      if (limit && filteredDashboards.length > limit) {
        filteredDashboards = filteredDashboards.slice(0, limit);
      }

      return {
        ...response,
        dashboards: filteredDashboards
      };
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      throw error;
    }
  }
};
