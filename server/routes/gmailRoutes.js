const express = require("express");
const router = express.Router();
const gmailController = require("../controllers/gmailController.js");
const chatController = require("../controllers/chatController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// Public routes
router.get("/auth/google", gmailController.googleAuth);
router.get("/auth/google/callback", gmailController.googleCallback);
router.get("/auth/logout", gmailController.logout);

// Protected routes
router.get("/auth/status", authMiddleware, gmailController.authStatus);
router.get("/auth/me", authMiddleware, gmailController.authMe);
router.get("/emails", authMiddleware, gmailController.getEmails);
router.post("/emails/scan", authMiddleware, gmailController.scanEmails);
router.post(
  "/emails/summarise",
  authMiddleware,
  gmailController.summariseEmail,
);
router.post("/chat", authMiddleware, chatController.chat); // ← chatbot

module.exports = router;
