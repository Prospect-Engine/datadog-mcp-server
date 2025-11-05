import axios, { AxiosRequestConfig } from "axios";
import http from "http";
import https from "https";

/**
 * Shared axios instance configured to use IPv4 only.
 * This fixes ETIMEDOUT issues when DNS returns only IPv6 addresses
 * but the system doesn't have working IPv6 connectivity.
 */
const httpClient = axios.create({
  timeout: 30000,
  httpAgent: new http.Agent({ family: 4 }),
  httpsAgent: new https.Agent({ family: 4 })
});

/**
 * Make a POST request to Datadog API with IPv4-only configuration
 */
export async function datadogPost(url: string, data: any, config?: AxiosRequestConfig) {
  const headers = {
    "Content-Type": "application/json",
    "DD-API-KEY": process.env.DD_API_KEY || "",
    "DD-APPLICATION-KEY": process.env.DD_APP_KEY || "",
    ...config?.headers
  };

  return httpClient.post(url, data, {
    ...config,
    headers
  });
}

/**
 * Make a GET request to Datadog API with IPv4-only configuration
 */
export async function datadogGet(url: string, config?: AxiosRequestConfig) {
  const headers = {
    "Content-Type": "application/json",
    "DD-API-KEY": process.env.DD_API_KEY || "",
    "DD-APPLICATION-KEY": process.env.DD_APP_KEY || "",
    ...config?.headers
  };

  return httpClient.get(url, {
    ...config,
    headers
  });
}

/**
 * Get the Datadog API base URL
 */
export function getDatadogApiUrl(version: "v1" | "v2" = "v1"): string {
  const site = process.env.DD_LOGS_SITE || process.env.DD_SITE || "datadoghq.com";
  return `https://api.${site}/api/${version}`;
}
