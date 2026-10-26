
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";

import {
  initializeApp,
  cert,
  getApps,
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

// Firebase service account file
const serviceAccount = JSON.parse(
  readFileSync(
    new URL("./serviceAccountKey.json", import.meta.url),
    "utf8"
  )
);

// Initialize Firebase Admin
const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap backend is running!",
    status: "success",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    backend: "Node.js + Express",
    database: "Firebase Admin SDK initialized",
  });
});

// Verify Firebase Authentication token
async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please login first.",
      });
    }

    const token = header.slice(7);
    const decodedToken = await auth.verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired login token.",
    });
  }
}

// Get logged-in user's profile
app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    return res.json({
      uid: userId,
      profile: userDoc.data(),
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
});

// Start Express server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `SkillSwap backend running at http://localhost:${PORT}`
  );
});
