import { datadogGet, getDatadogApiUrl } from "../utils/httpClient";

type GetEventsParams = {
  start: number;
  end: number;
  priority?: "normal" | "low";
  sources?: string;
  tags?: string;
  unaggregated?: boolean;
  excludeAggregation?: boolean;
  limit?: number;
};

export const getEvents = {
  initialize: () => {
    // No initialization needed with direct HTTP client
  },

  execute: async (params: GetEventsParams) => {
    try {
      const {
        start,
        end,
        priority,
        sources,
        tags,
        unaggregated,
        excludeAggregation,
        limit
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("start", start.toString());
      queryParams.append("end", end.toString());
      if (priority) queryParams.append("priority", priority);
      if (sources) queryParams.append("sources", sources);
      if (tags) queryParams.append("tags", tags);
      if (unaggregated !== undefined) queryParams.append("unaggregated", String(unaggregated));
      if (excludeAggregation !== undefined) queryParams.append("exclude_aggregate", String(excludeAggregation));

      const apiUrl = `${getDatadogApiUrl("v1")}/events?${queryParams.toString()}`;

      const response = await datadogGet(apiUrl);

      // Apply client-side limit if specified
      if (limit && response.data.events && response.data.events.length > limit) {
        response.data.events = response.data.events.slice(0, limit);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }
};
