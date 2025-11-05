import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetMonitorsParams = {
  groupStates?: string[];
  tags?: string;
  monitorTags?: string;
  limit?: number;
};

export const getMonitors = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetMonitorsParams) => {
    try {
      const { groupStates, tags, monitorTags, limit } = params;

      const queryParams = new URLSearchParams();
      if (groupStates && groupStates.length > 0) {
        queryParams.append("group_states", groupStates.join(","));
      }
      if (tags) {
        queryParams.append("tags", tags);
      }
      if (monitorTags) {
        queryParams.append("monitor_tags", monitorTags);
      }

      const apiUrl = `${getDatadogApiUrl("v1")}/monitor${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await datadogGet(apiUrl);

      if (limit && response.data.length > limit) {
        return response.data.slice(0, limit);
      }

      return response.data;
    } catch (error: any) {
      if (error.status === 403) {
        console.error(
          "Authorization failed (403 Forbidden): Check that your API key and Application key are valid and have sufficient permissions to access monitors."
        );
        throw new Error(
          "Datadog API authorization failed. Please verify your API and Application keys have the correct permissions."
        );
      } else {
        console.error("Error fetching monitors:", error);
        throw error;
      }
    }
  }
};
