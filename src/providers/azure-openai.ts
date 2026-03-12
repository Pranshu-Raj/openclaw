const AZURE_OPENAI_HOST_SUFFIXES = [".openai.azure.com", ".services.ai.azure.com"] as const;
const AZURE_DEPLOYMENTS_PATH_SEGMENT = "/openai/deployments/";
const AZURE_OPENAI_V1_PATH_RE = /^\/openai\/v1(?:\/|$)/i;

export const DEFAULT_AZURE_OPENAI_API_VERSION = "2024-10-21";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hasAzureHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return AZURE_OPENAI_HOST_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

export function isAzureOpenAiUrl(baseUrl: string): boolean {
  const parsed = parseUrl(baseUrl);
  return parsed ? hasAzureHost(parsed.hostname) : false;
}

export function isAzureOpenAiV1BaseUrl(baseUrl: string): boolean {
  const parsed = parseUrl(baseUrl);
  if (!parsed || !hasAzureHost(parsed.hostname)) {
    return false;
  }
  return AZURE_OPENAI_V1_PATH_RE.test(parsed.pathname);
}

export function normalizeAzureOpenAiBaseUrl(params: { baseUrl: string; modelId: string }): string {
  const parsed = parseUrl(params.baseUrl.trim());
  if (!parsed || !hasAzureHost(parsed.hostname)) {
    return params.baseUrl.trim();
  }
  if (
    parsed.pathname.includes(AZURE_DEPLOYMENTS_PATH_SEGMENT) ||
    AZURE_OPENAI_V1_PATH_RE.test(parsed.pathname)
  ) {
    return trimTrailingSlashes(parsed.href);
  }

  const root = trimTrailingSlashes(parsed.pathname);
  parsed.pathname = `${root}/openai/deployments/${encodeURIComponent(params.modelId)}`;
  return trimTrailingSlashes(parsed.href);
}

export function resolveAzureOpenAiEndpointUrl(params: {
  baseUrl: string;
  modelId: string;
  endpointPath: "chat/completions" | "messages";
  apiVersion?: string;
}): string {
  const normalizedBaseUrl = normalizeAzureOpenAiBaseUrl({
    baseUrl: params.baseUrl,
    modelId: params.modelId,
  });
  const endpointUrl = new URL(
    params.endpointPath,
    normalizedBaseUrl.endsWith("/") ? normalizedBaseUrl : `${normalizedBaseUrl}/`,
  );
  if (isAzureOpenAiUrl(normalizedBaseUrl) && !isAzureOpenAiV1BaseUrl(normalizedBaseUrl)) {
    endpointUrl.searchParams.set("api-version", params.apiVersion ?? DEFAULT_AZURE_OPENAI_API_VERSION);
  }
  return endpointUrl.href;
}
