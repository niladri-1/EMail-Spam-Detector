// server/controllers/chatController.js
const { geminiGenerate } = require("../services/geminiClient");

const SYSTEM_PROMPT = `You are a helpful inbox assistant for a Gmail spam checker app called "Spam Checker".

You help users with:
- Questions about the currently open email (subject, sender, content, intent, safety)
- Understanding spam detection results (why an email was flagged)
- Email security best practices
- How the app works (OAuth, local spam scanning, no data stored)
- Inbox health score and how to improve it

Rules:
- Keep answers concise (2-4 sentences) unless detail is clearly needed
- When email context is provided, reference it specifically — don't be generic
- If asked "is this safe?", use the spam scan result if available
- If asked to summarise, summarise the actual email content provided
- If no email is open and the question is about "this email", say you don't see an open email
- For unrelated topics, politely redirect to email/inbox topics`;

exports.chat = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
  }

  const { message, history = [], emailContext } = req.body;
  if (!message?.trim())
    return res.status(400).json({ error: "message required" });

  // Build contents array
  const contents = [];

  // Inject open email as context
  if (emailContext) {
    const emailCtxText = `[CURRENT EMAIL CONTEXT]
Subject: ${emailContext.subject}
From: ${emailContext.from}
To: ${emailContext.to || "—"}
Date: ${emailContext.date || "—"}
Tab: ${emailContext.tab} (${emailContext.tab === "sent" ? "sent by user" : "received"})
Spam scan result: ${emailContext.spamResult}
Snippet: ${emailContext.snippet || "—"}

Email body preview:
${emailContext.bodyPreview || "(no body)"}
[END EMAIL CONTEXT]

The user is currently viewing this email. Use this context to answer their questions specifically.`;

    contents.push({ role: "user", parts: [{ text: emailCtxText }] });
    contents.push({
      role: "model",
      parts: [
        {
          text: "Got it — I have the full context of the email you're viewing. Ask me anything about it.",
        },
      ],
    });
  }

  // Add conversation history (skip welcome message)
  for (const msg of history.slice(1)) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  }

  // Add new user message
  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    const { text, model } = await geminiGenerate({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.35, maxOutputTokens: 450 },
    });

    res.json({ reply: text, model }); // send model name too so frontend can show it
  } catch (err) {
    console.error("Chat error:", err.message);
    if (err.isRateLimit) {
      return res.status(429).json({ error: "quota_exceeded" });
    }
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
