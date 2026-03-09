// ═══════════════════════════════════════════════════════════════
//  ENTERPRISE-GRADE RULE-BASED SPAM DETECTOR
//  No API. No quota. Instant. Covers real-world spam patterns.
// ═══════════════════════════════════════════════════════════════

// ── TIER 1: Globally trusted sender domains (whitelist)
const TRUSTED_DOMAINS = new Set([
  // Google ecosystem
  "google.com",
  "gmail.com",
  "googlemail.com",
  "accounts.google.com",
  "mail.google.com",
  "youtube.com",
  "google.co.in",
  // Microsoft
  "microsoft.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "office.com",
  "office365.com",
  "azure.com",
  // Apple
  "apple.com",
  "icloud.com",
  "me.com",
  "mac.com",
  // Amazon
  "amazon.com",
  "amazon.in",
  "amazon.co.uk",
  "aws.amazon.com",
  "ses.amazonaws.com",
  "amazonses.com",
  // Social
  "linkedin.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "telegram.org",
  "discord.com",
  // Dev / Tech
  "github.com",
  "gitlab.com",
  "stackoverflow.com",
  "npmjs.com",
  "heroku.com",
  "vercel.com",
  "netlify.com",
  "cloudflare.com",
  "digitalocean.com",
  "stripe.com",
  "twilio.com",
  "sendgrid.net",
  "mailchimp.com",
  "postmarkapp.com",
  // Indian services
  "jio.com",
  "airtel.in",
  "bsnl.co.in",
  "vodafone.in",
  "idea.net.in",
  "paytm.com",
  "phonepe.com",
  "gpay.com",
  "razorpay.com",
  "cashfree.com",
  "flipkart.com",
  "myntra.com",
  "meesho.com",
  "snapdeal.com",
  "zomato.com",
  "swiggy.com",
  "blinkit.com",
  "bigbasket.com",
  "makemytrip.com",
  "goibibo.com",
  "yatra.com",
  "cleartrip.com",
  "naukri.com",
  "indeed.com",
  "shine.com",
  "monster.com",
  "irctc.co.in",
  "uidai.gov.in",
  "incometax.gov.in",
  "epfindia.gov.in",
  "sbi.co.in",
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "kotak.com",
  "yesbank.in",
  "pnbindia.in",
  "bankofbaroda.in",
  // Global services
  "paypal.com",
  "ebay.com",
  "netflix.com",
  "spotify.com",
  "dropbox.com",
  "zoom.us",
  "slack.com",
  "notion.so",
  "anthropic.com",
  "openai.com",
  "figma.com",
  "canva.com",
  "shopify.com",
  "woocommerce.com",
  "wordpress.com",
  "medium.com",
  "substack.com",
  "mailgun.org",
  // Education
  "coursera.org",
  "udemy.com",
  "edx.org",
  "khanacademy.org",
  "duolingo.com",
  "leetcode.com",
  "hackerrank.com",
  "codechef.com",
]);

// ── TIER 2: Known spam/bulk sender domains
const KNOWN_SPAM_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "mailnator.com",
  "throwaway.email",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "trashmail.com",
  "yopmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "mailnull.com",
  "maildrop.cc",
  "getairmail.com",
  "spamgourmet.com",
  "discard.email",
  "mailscrap.com",
  "spamherePlease.com",
]);

// ── Suspicious TLDs associated with spam
const SPAM_TLDS = new Set([
  ".xyz",
  ".tk",
  ".ml",
  ".ga",
  ".cf",
  ".gq",
  ".top",
  ".click",
  ".loan",
  ".work",
  ".review",
  ".win",
  ".download",
  ".racing",
  ".accountant",
  ".science",
  ".party",
  ".date",
  ".faith",
  ".trade",
  ".webcam",
  ".men",
  ".bid",
  ".stream",
  ".gdn",
]);

// ── Spam subject keywords (weighted)
const SUBJECT_RULES = [
  // Lottery / Prize (weight 4)
  {
    pattern:
      /\b(you('ve| have)? won|winner|lottery|jackpot|prize|reward|lucky draw|congratulations.*(won|prize|selected))\b/i,
    score: 4,
    reason: "Lottery or prize scam",
  },
  // Phishing (weight 5)
  {
    pattern:
      /\b(verify (your )?(account|email|identity|password)|account (suspended|blocked|locked|compromised)|unusual (activity|sign.?in)|confirm (your )?(identity|account|email|payment))\b/i,
    score: 5,
    reason: "Phishing — account verification request",
  },
  // Urgency manipulation (weight 3)
  {
    pattern:
      /\b(act (now|immediately|fast|today)|limited time|expires? (today|soon|in \d+)|last chance|final (notice|warning|reminder)|don'?t miss|deadline)\b/i,
    score: 3,
    reason: "Urgency manipulation tactic",
  },
  // Financial scam (weight 5)
  {
    pattern:
      /\b(wire transfer|send (money|funds|bitcoin|crypto)|bank (details|account|transfer)|inheritance|next of kin|million (dollars|usd|pounds)|nigerian|investment (opportunity|offer))\b/i,
    score: 5,
    reason: "Financial scam or advance-fee fraud",
  },
  // Crypto spam (weight 4)
  {
    pattern:
      /\b(bitcoin|crypto(currency)?|blockchain|nft|token|defi|ethereum|binance|coinbase|wallet address|mining (profit|reward))\b/i,
    score: 4,
    reason: "Cryptocurrency spam",
  },
  // Job / Income scam (weight 3)
  {
    pattern:
      /\b(work from home|make money (fast|online|now)|earn \$?\d+|passive income|get (rich|paid) (fast|quick|easy)|no experience (required|needed)|part.?time.*earn)\b/i,
    score: 3,
    reason: "Work-from-home or income scam",
  },
  // Health spam (weight 3)
  {
    pattern:
      /\b(weight loss|lose \d+ (pounds|kg)|diet pill|fat burn|keto|miracle (cure|treatment)|free trial.*pill|erectile|enlarge|male enhancement)\b/i,
    score: 3,
    reason: "Health or pharmaceutical spam",
  },
  // Free stuff bait (weight 2)
  {
    pattern:
      /\b(100% free|absolutely free|free gift|get it free|no cost|claim (your )?(free|gift|reward)|free (iphone|samsung|laptop|voucher|coupon))\b/i,
    score: 2,
    reason: "Free offer bait",
  },
  // Unsubscribe / Bulk (weight 1)
  {
    pattern:
      /\b(unsubscribe|opt.?out|remove me|manage (your )?preferences|you('re| are) receiving this (because|email))\b/i,
    score: 1,
    reason: "Bulk marketing email",
  },
  // Adult / Dating (weight 4)
  {
    pattern:
      /\b(adult|dating|singles (near|in your area)|hot (singles|girls|guys|women|men)|meet (women|men|singles)|hookup|xxx|nude|nsfw)\b/i,
    score: 4,
    reason: "Adult or dating spam",
  },
  // Fake invoice / delivery (weight 3)
  {
    pattern:
      /\b(your (package|parcel|order|shipment) (is|has been|was) (held|delayed|failed|returned|undelivered)|failed delivery|re-?schedule (your )?delivery|customs (fee|charge|hold))\b/i,
    score: 3,
    reason: "Fake delivery notification",
  },
  // Promo overload (weight 2)
  {
    pattern:
      /\b(\d+% off|\d+% discount|buy (one|1) get (one|1)|flash sale|mega sale|special (offer|deal)|exclusive (deal|offer|discount)|today only)\b/i,
    score: 2,
    reason: "Promotional bulk offer",
  },
];

// ── Spam snippet/body rules
const SNIPPET_RULES = [
  {
    pattern:
      /click (here|below|the link|this link) to (verify|confirm|claim|update|access|login|sign in)/i,
    score: 4,
    reason: "Phishing call-to-action link",
  },
  {
    pattern:
      /your (account|password|card|payment method) (will be|has been|is|was) (deleted|suspended|charged|expired|compromised)/i,
    score: 5,
    reason: "Fake account threat",
  },
  {
    pattern:
      /(enter|provide|submit).{0,30}(password|credit card|ssn|social security|bank account|otp|pin)/i,
    score: 5,
    reason: "Credential harvesting attempt",
  },
  {
    pattern:
      /this (email|message|offer) (will expire|expires|is valid) (in|for|until)/i,
    score: 2,
    reason: "Artificial urgency",
  },
  {
    pattern:
      /(you have|you've) (been selected|won|qualified|earned|received) (a |an )?(prize|reward|gift|cash|voucher)/i,
    score: 4,
    reason: "False prize notification",
  },
  {
    pattern:
      /dear (valued |lucky |lucky winner|beneficiary|friend|sir|madam|customer)/i,
    score: 2,
    reason: "Generic greeting — common in spam",
  },
  {
    pattern:
      /to (stop|manage|cancel) (receiving|emails|messages|notifications)/i,
    score: 1,
    reason: "Bulk sender footer",
  },
  {
    pattern: /\$([\d,]+)\s*(usd|dollars?|reward|cash|prize|bonus)/i,
    score: 3,
    reason: "Dollar amount lure",
  },
  {
    pattern: /forward this (email|message|to \d+)/i,
    score: 3,
    reason: "Chain email pattern",
  },
  {
    pattern: /not (financial|investment|medical) advice/i,
    score: 2,
    reason: "Disclaimer typical of promo/crypto spam",
  },
  {
    pattern:
      /(reply|respond) with your (name|address|phone|bank|details|information)/i,
    score: 5,
    reason: "Personal info harvesting",
  },
  {
    pattern: /this is not spam|you opted in|you signed up|you requested/i,
    score: 2,
    reason: "Spam self-defense disclaimer",
  },
];

// ── Sender pattern rules
const SENDER_RULES = [
  {
    pattern:
      /noreply@(?!google|microsoft|amazon|github|linkedin|anthropic|apple|paypal|stripe|jio|airtel|flipkart|zomato|swiggy|paytm|irctc)/i,
    score: 1,
    reason: "No-reply bulk sender",
  },
  {
    pattern:
      /(promo|newsletter|offers|deals|marketing|info|sales|support|alert|notify|update|news)@(?!(google|microsoft|amazon|github|linkedin|anthropic|apple))/i,
    score: 2,
    reason: "Bulk marketing sender address",
  },
  { pattern: /\d{4,}@/i, score: 2, reason: "Numeric spam account" },
  {
    pattern: /@(mail\d|send\d|smtp\d|bulk|mass|blast)/i,
    score: 3,
    reason: "Bulk mail server pattern",
  },
  {
    pattern: /\.(xyz|tk|ml|ga|cf|gq|top|click|loan|work|review|win)>/i,
    score: 4,
    reason: "Spam-associated domain TLD",
  },
  {
    pattern: /@(?:\d{1,3}\.){3}\d{1,3}/i,
    score: 5,
    reason: "Email from raw IP address",
  },
];

// ── Structural signals
function structuralScore(subject, from, snippet) {
  let score = 0;
  const reasons = [];

  // All-caps subject
  if (
    subject &&
    subject.length > 8 &&
    subject.trim() === subject.trim().toUpperCase() &&
    /[A-Z]{4,}/.test(subject)
  ) {
    score += 2;
    reasons.push("All-caps subject");
  }

  // Excessive punctuation
  const exclamations = (subject || "").split("!").length - 1;
  const questions = (subject || "").split("?").length - 1;
  if (exclamations >= 2) {
    score += 1;
    reasons.push("Excessive exclamation marks");
  }
  if (questions >= 2) {
    score += 1;
    reasons.push("Excessive question marks");
  }

  // Excessive emoji in subject
  const emojiCount =
    (subject || "").match(/[\u{1F300}-\u{1FFFF}]|\p{Emoji}/gu)?.length || 0;
  if (emojiCount >= 3) {
    score += 1;
    reasons.push("Excessive emoji in subject");
  }

  // Dollar signs in subject
  if (/\$\d+/.test(subject || "")) {
    score += 2;
    reasons.push("Dollar amount in subject");
  }

  // RE: or FWD: on unsolicited mail patterns
  if (/^(re:|fwd?:)\s*(re:|fwd?:)/i.test(subject || "")) {
    score += 1;
    reasons.push("Suspicious reply chain subject");
  }

  // Very short from display name (spammers often omit it)
  const displayName = from?.match(/^"?([^<"]+)"?\s*</)?.[1]?.trim();
  if (displayName && displayName.length < 3) {
    score += 1;
    reasons.push("Suspicious sender display name");
  }

  // No display name at all (just raw email)
  if (from && !from.includes("<") && from.includes("@")) {
    score += 1;
    reasons.push("No sender display name");
  }

  return { score, reasons };
}

// ── Extract domain from From header
function extractDomain(from) {
  const m1 = from?.match(/<[^@]+@([^>]+)>/);
  if (m1) return m1[1].toLowerCase().trim();
  const m2 = from?.match(/@([\w.-]+)/);
  return m2 ? m2[1].toLowerCase().trim() : "";
}

function extractTLD(domain) {
  const parts = domain.split(".");
  return parts.length >= 2 ? "." + parts[parts.length - 1] : "";
}

// ── Main classifier
function classifyEmail({ id, subject, from, snippet }) {
  const subj = subject || "";
  const snip = snippet || "";
  const sender = from || "";

  let totalScore = 0;
  const allReasons = [];

  // ── Fast-path: known trusted domain
  const domain = extractDomain(sender);
  const tld = extractTLD(domain);

  if (TRUSTED_DOMAINS.has(domain)) {
    return { id, classification: "safe", reason: "Verified trusted sender" };
  }

  // Check parent domain (e.g. mail.google.com → google.com)
  const domainParts = domain.split(".");
  if (domainParts.length >= 2) {
    const parent = domainParts.slice(-2).join(".");
    if (TRUSTED_DOMAINS.has(parent)) {
      return { id, classification: "safe", reason: "Trusted sender domain" };
    }
  }

  // ── Fast-path: known spam domain
  if (KNOWN_SPAM_DOMAINS.has(domain)) {
    return {
      id,
      classification: "spam",
      reason: "Known spam/throwaway domain",
    };
  }

  // ── Spam TLD check
  if (SPAM_TLDS.has(tld)) {
    totalScore += 3;
    allReasons.push("Spam-associated domain extension");
  }

  // ── Apply subject rules
  for (const rule of SUBJECT_RULES) {
    if (rule.pattern.test(subj)) {
      totalScore += rule.score;
      allReasons.push(rule.reason);
    }
  }

  // ── Apply snippet rules
  for (const rule of SNIPPET_RULES) {
    if (rule.pattern.test(snip)) {
      totalScore += rule.score;
      allReasons.push(rule.reason);
    }
  }

  // ── Apply sender rules
  for (const rule of SENDER_RULES) {
    if (rule.pattern.test(sender)) {
      totalScore += rule.score;
      allReasons.push(rule.reason);
    }
  }

  // ── Structural signals
  const structural = structuralScore(subj, sender, snip);
  totalScore += structural.score;
  allReasons.push(...structural.reasons);

  // ── Verdict with confidence tiers
  if (totalScore >= 5) {
    return {
      id,
      classification: "spam",
      reason: allReasons[0] || "Multiple spam signals detected",
    };
  }

  if (totalScore >= 3) {
    return {
      id,
      classification: "spam",
      reason: allReasons[0] || "Suspicious email patterns detected",
    };
  }

  if (totalScore >= 1) {
    return {
      id,
      classification: "safe",
      reason: "Minor flags — likely promotional but safe",
    };
  }

  return {
    id,
    classification: "safe",
    reason: "No spam signals detected",
  };
}

// ── Public API (async-compatible so controller code stays unchanged)
function scanEmailsForSpam(emails) {
  if (!emails || emails.length === 0) return Promise.resolve({});

  const map = {};
  for (const email of emails) {
    const result = classifyEmail(email);
    map[result.id] = {
      classification: result.classification,
      reason: result.reason,
    };
  }

  return Promise.resolve(map);
}

module.exports = { scanEmailsForSpam };
