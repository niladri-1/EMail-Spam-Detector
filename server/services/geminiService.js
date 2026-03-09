// server/services/geminiService.js
const { geminiGenerate } = require("./geminiClient");

async function summariseEmail({ subject, from, date, body, bodyType }) {
  // Strip HTML tags so Gemini gets clean text
  const plainBody =
    bodyType === "html"
      ? body
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim()
      : body || "";

  const truncated =
    plainBody.length > 6000 ? plainBody.slice(0, 6000) + "…" : plainBody;

  const prompt = `You are an email assistant. Summarise the following email in 3–5 concise bullet points. Focus on:
- The main purpose or request
- Any action items or deadlines
- Key information the reader needs

Do NOT include greetings or sign-offs. Be specific, not generic. Use plain text only (no markdown headers or bold).

---
Subject: ${subject || "(no subject)"}
From: ${from || "unknown"}
Date: ${date || ""}

${truncated}
---`;

  const { text } = await geminiGenerate({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
  });

  return text;
}

module.exports = { summariseEmail };
