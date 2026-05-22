/**
 * Safe API request client wrapper
 * Avoids patching window.fetch which is read-only in some iframe sandboxes.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const modifiedInit = init ? { ...init } : {};
  const headers: Record<string, string> = {};

  // Copy existing headers safely
  if (modifiedInit.headers) {
    if (modifiedInit.headers instanceof Headers) {
      modifiedInit.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(modifiedInit.headers)) {
      modifiedInit.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, modifiedInit.headers);
    }
  }

  // Load custom API keys from localStorage safely
  try {
    const stored = localStorage.getItem("wechat_ai_api_keys");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.Gemini && parsed.Gemini.trim() !== "") {
        headers["x-gemini-api-key"] = parsed.Gemini.trim();
      }
      if (parsed.ChatGPT && parsed.ChatGPT.trim() !== "") {
        headers["x-openai-api-key"] = parsed.ChatGPT.trim();
      }
      if (parsed.DeepSeek && parsed.DeepSeek.trim() !== "") {
        headers["x-deepseek-api-key"] = parsed.DeepSeek.trim();
      }
      if (parsed.Volcengine && parsed.Volcengine.trim() !== "") {
        headers["x-volcengine-api-key"] = parsed.Volcengine.trim();
      }
      if (parsed.Stability && parsed.Stability.trim() !== "") {
        headers["x-stability-api-key"] = parsed.Stability.trim();
      }
      if (parsed["Claude-3.5"] && parsed["Claude-3.5"].trim() !== "") {
        headers["x-claude-api-key"] = parsed["Claude-3.5"].trim();
      }
      if (parsed.Kimi && parsed.Kimi.trim() !== "") {
        headers["x-kimi-api-key"] = parsed.Kimi.trim();
      }
      if (parsed.Bailian && parsed.Bailian.trim() !== "") {
        headers["x-bailian-api-key"] = parsed.Bailian.trim();
      }
      if (parsed.Grsai && parsed.Grsai.trim() !== "") {
        headers["x-grsai-api-key"] = parsed.Grsai.trim();
      }
    }
  } catch (e) {
    console.error("apiFetch helper injection error:", e);
  }

  modifiedInit.headers = headers;
  return fetch(url, modifiedInit);
}
