// server/services/geminiClient.js
// Shared Gemini API client with automatic model fallback.
// On 429 (rate limit), tries the next model in the chain until one responds.

const https = require("https");

const GEMINI_HOST = "generativelanguage.googleapis.com";

// Fallback chain — ordered best → most available
// All have free tier quotas on Gemini API
const MODEL_CHAIN = [
  "gemini-3.1-flash-lite-preview", // Best: 500 RPD, 15 RPM, 250k TPM — try first
  "gemini-2.5-flash", // Fallback: solid quality, separate quota
  "gemini-2.5-flash-lite", // Fallback: lighter, higher availability
  "gemini-2.0-flash", // Fallback: stable, own quota pool
  "gemini-2.0-flash-lite", // Last resort: highest availability
];

// Gemini 3.x models require thinking_level to avoid burning tokens on reasoning.
// Set "minimal" for chatbot/summary tasks — fast responses, no extra cost.
const GEMINI3_MODELS = new Set([
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
]);

function httpsPost(model, apiKey, body) {
  return new Promise((resolve, reject) => {
    const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Gemini 3.x defaults to high thinking — force minimal for speed/cost on chat/summary tasks
    let finalBody = body;
    if (GEMINI3_MODELS.has(model)) {
      finalBody = {
        ...body,
        generationConfig: {
          ...body.generationConfig,
          thinkingConfig: { thinkingBudget: 0 }, // 0 = disable thinking (fastest)
        },
      };
    }

    const data = JSON.stringify(finalBody);
    const options = {
      hostname: GEMINI_HOST,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode === 429) {
            // Rate limited — try next model
            reject(
              Object.assign(new Error("RATE_LIMITED"), {
                isRateLimit: true,
                model,
              }),
            );
          } else if (res.statusCode === 404) {
            // Model not found / not yet available — skip to next
            console.warn(`[Gemini] ${model} returned 404 — skipping`);
            reject(
              Object.assign(new Error("MODEL_NOT_FOUND"), {
                isRateLimit: true,
                model,
              }),
            );
          } else if (res.statusCode >= 400) {
            reject(
              new Error(
                `Gemini ${res.statusCode} (${model}): ${raw.slice(0, 300)}`,
              ),
            );
          } else {
            resolve({ data: parsed, model }); // include which model succeeded
          }
        } catch {
          reject(new Error(`Parse error from ${model}: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

/**
 * Call Gemini with automatic fallback.
 * @param {object} body  — the generateContent request body (contents, generationConfig, etc.)
 * @param {string} [startModel] — override start of chain (optional)
 * @returns {{ text: string, model: string }} — response text + which model answered
 */
async function geminiGenerate(body, startModel) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in server environment");

  const chain = startModel
    ? [startModel, ...MODEL_CHAIN.filter((m) => m !== startModel)]
    : MODEL_CHAIN;

  let lastError;

  for (const model of chain) {
    try {
      const { data, model: usedModel } = await httpsPost(model, apiKey, body);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Empty response from ${usedModel}`);

      if (usedModel !== chain[0]) {
        console.log(
          `[Gemini] Fallback used: ${usedModel} (primary was rate-limited)`,
        );
      }

      return { text: text.trim(), model: usedModel };
    } catch (err) {
      if (err.isRateLimit) {
        console.warn(`[Gemini] ${model} rate-limited — trying next model`);
        lastError = err;
        continue; // try next model
      }
      throw err; // non-429 error — don't retry
    }
  }

  // All models exhausted
  const allLimited = new Error("ALL_MODELS_RATE_LIMITED");
  allLimited.isRateLimit = true;
  throw allLimited;
}

module.exports = { geminiGenerate, MODEL_CHAIN };
