const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const { oauth2Client, SCOPES } = require("../config/googleAuth");
const { fetchEmails } = require("../services/gmailService");
const { scanEmailsForSpam } = require("../services/spamCheckService");
const User = require("../models/User");

// Helper: create a per-request auth client from tokens
function createAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
  );
  client.setCredentials(tokens);
  return client;
}

exports.googleAuth = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "select_account",
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const base = process.env.FRONTEND_URI.replace(/\/home$/, "").replace(
    /\/$/,
    "",
  );

  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);

    const tempClient = createAuthClient(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: tempClient });
    const { data } = await oauth2.userinfo.get();

    await User.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          googleId: data.id,
          fullName: data.name,
          email: data.email,
          picture: data.picture,
          locale: data.locale,
          lastLoginAt: new Date(),
        },
        $inc: { loginCount: 1 },
      },
      { upsert: true, new: true },
    );

    console.log(`User saved → ${data.name} (${data.email})`);

    const jwtToken = jwt.sign(
      {
        tokens,
        user: {
          name: data.name,
          email: data.email,
          picture: data.picture,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Always redirect to "/" so App.jsx picks up the token
    res.redirect(`${base}/?token=${jwtToken}`);
  } catch (err) {
    console.error("Callback error:", err.message);
    res.redirect(`${base}/home`);
  }
};

exports.getEmails = async (req, res) => {
  try {
    const authClient = createAuthClient(req.user.tokens);
    const emails = await fetchEmails(authClient);
    res.json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.scanEmails = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "emails array required" });
    }
    const results = await scanEmailsForSpam(emails);
    res.json(results);
  } catch (err) {
    console.error("Scan error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.authStatus = (req, res) => {
  res.json({ authenticated: true });
};

exports.authMe = (req, res) => {
  res.json(req.user.user);
};

exports.logout = (req, res) => {
  res.json({ success: true });
};

// ── Gemini summariser (loaded lazily so a missing file won't crash startup)
let geminiSummarise = null;
try {
  geminiSummarise = require("../services/geminiService").summariseEmail;
} catch (e) {
  console.warn("geminiService not found — AI summary disabled:", e.message);
}

exports.summariseEmail = async (req, res) => {
  if (!geminiSummarise) {
    return res
      .status(503)
      .json({
        error:
          "AI summariser not configured. Add geminiService.js to server/services/.",
      });
  }
  try {
    const { subject, from, date, body, bodyType } = req.body;
    if (!body) return res.status(400).json({ error: "Email body is required" });
    const summary = await geminiSummarise({
      subject,
      from,
      date,
      body,
      bodyType,
    });
    res.json({ summary });
  } catch (err) {
    console.error("Summarise error:", err.message);
    if (err.isRateLimit)
      return res.status(429).json({ error: "quota_exceeded" });
    res.status(500).json({ error: err.message || "Failed to summarise email" });
  }
};
