import { describe, expect, it } from "vitest";
import {
  DEFAULT_AZURE_OPENAI_API_VERSION,
  isAzureOpenAiUrl,
  isAzureOpenAiV1BaseUrl,
  normalizeAzureOpenAiBaseUrl,
  resolveAzureOpenAiEndpointUrl,
} from "./azure-openai.js";

describe("azure-openai helpers", () => {
  it("detects Azure OpenAI hosts", () => {
    expect(isAzureOpenAiUrl("https://my-resource.openai.azure.com")).toBe(true);
    expect(isAzureOpenAiUrl("https://my-resource.services.ai.azure.com")).toBe(true);
    expect(isAzureOpenAiUrl("https://api.openai.com/v1")).toBe(false);
  });

  it("does not rewrite Azure /openai/v1 base URLs", () => {
    expect(
      normalizeAzureOpenAiBaseUrl({
        baseUrl: "https://my-resource.openai.azure.com/openai/v1",
        modelId: "gpt-4.1",
      }),
    ).toBe("https://my-resource.openai.azure.com/openai/v1");
    expect(isAzureOpenAiV1BaseUrl("https://my-resource.openai.azure.com/openai/v1")).toBe(true);
  });

  it("rewrites classic Azure hosts to deployment paths", () => {
    expect(
      normalizeAzureOpenAiBaseUrl({
        baseUrl: "https://my-resource.openai.azure.com",
        modelId: "gpt-4.1",
      }),
    ).toBe("https://my-resource.openai.azure.com/openai/deployments/gpt-4.1");
  });

  it("builds deployment endpoint URLs with default API version", () => {
    expect(
      resolveAzureOpenAiEndpointUrl({
        baseUrl: "https://my-resource.openai.azure.com",
        modelId: "gpt-4.1",
        endpointPath: "chat/completions",
      }),
    ).toBe(
      `https://my-resource.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=${DEFAULT_AZURE_OPENAI_API_VERSION}`,
    );
  });

  it("omits api-version for Azure /openai/v1 endpoints", () => {
    expect(
      resolveAzureOpenAiEndpointUrl({
        baseUrl: "https://my-resource.openai.azure.com/openai/v1",
        modelId: "gpt-4.1",
        endpointPath: "chat/completions",
      }),
    ).toBe("https://my-resource.openai.azure.com/openai/v1/chat/completions");
  });
});
