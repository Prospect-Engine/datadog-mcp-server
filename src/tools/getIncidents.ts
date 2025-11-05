import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetIncidentsParams = {
  includeArchived?: boolean;
  pageSize?: number;
  pageOffset?: number;
  query?: string;
  limit?: number;
};

export const getIncidents = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetIncidentsParams) => {
    try {
      const { includeArchived, pageSize, pageOffset, query, limit } = params;

      const queryParams = new URLSearchParams();
      if (includeArchived !== undefined) queryParams.append("include", "archived");
      if (pageSize !== undefined) queryParams.append("page[size]", pageSize.toString());
      if (pageOffset !== undefined) queryParams.append("page[offset]", pageOffset.toString());
      if (query !== undefined) queryParams.append("filter[query]", query);

      const apiUrl = `${getDatadogApiUrl("v2")}/incidents${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await datadogGet(apiUrl);

      // Apply client-side limit if specified
      if (limit && response.data.data && response.data.data.length > limit) {
        response.data.data = response.data.data.slice(0, limit);
      }

      return response.data;
    } catch (error: any) {
      if (error.status === 403) {
        console.error(
          "Authorization failed (403 Forbidden): Check that your API key and Application key are valid and have sufficient permissions to access incidents."
        );
        throw new Error(
          "Datadog API authorization failed. Please verify your API and Application keys have the correct permissions."
        );
      } else {
        console.error("Error fetching incidents:", error);
        throw error;
      }
    }
  }
};
