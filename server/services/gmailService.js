const { google } = require("googleapis");

function extractBody(payload) {
  if (payload.parts && payload.parts.length > 0) {
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart) return { type: "html", data: htmlPart.body?.data };

    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart) return { type: "text", data: textPart.body?.data };

    for (const part of payload.parts) {
      const found = extractBody(part);
      if (found) return found;
    }
  }

  if (payload.body?.data) {
    return {
      type: payload.mimeType === "text/html" ? "html" : "text",
      data: payload.body.data,
    };
  }

  return null;
}

function decodeBase64(encoded) {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

async function fetchMailsByLabel(gmail, labelId) {
  const res = await gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId],
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  const emails = [];

  for (const msg of messages) {
    const data = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const headers = data.data.payload.headers;
    const subject = headers.find((h) => h.name === "Subject")?.value;
    const from = headers.find((h) => h.name === "From")?.value;
    const to = headers.find((h) => h.name === "To")?.value;
    const date = headers.find((h) => h.name === "Date")?.value;

    const bodyInfo = extractBody(data.data.payload);
    let body = "";
    let bodyType = "text";

    if (bodyInfo?.data) {
      body = decodeBase64(bodyInfo.data);
      bodyType = bodyInfo.type;
    } else {
      body = data.data.snippet || "";
    }

    emails.push({
      id: msg.id,
      subject,
      from,
      to,
      date,
      snippet: data.data.snippet,
      body,
      bodyType,
    });
  }

  return emails;
}

async function fetchEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  const [inbox, sent] = await Promise.all([
    fetchMailsByLabel(gmail, "INBOX"),
    fetchMailsByLabel(gmail, "SENT"),
  ]);

  return { inbox, sent };
}

module.exports = { fetchEmails };
