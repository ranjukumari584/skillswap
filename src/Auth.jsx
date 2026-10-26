
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./App.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter email and password.");
      return;
    }

    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        await updateProfile(credential.user, {
          displayName: name.trim(),
        });

        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          name: name.trim(),
          email: cleanEmail,
          year: "3rd Year",
          branch: "",
          college: "",
          bio: "",
          teachSkills: [],
          learnSkills: [],
          createdAt: new Date().toISOString(),
        });
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        const profileRef = doc(db, "users", credential.user.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
          await setDoc(profileRef, {
            uid: credential.user.uid,
            name: credential.user.displayName || "User",
            email: cleanEmail,
            year: "3rd Year",
            branch: "",
            college: "",
            bio: "",
            teachSkills: [],
            learnSkills: [],
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Authentication failed:", err);

      const messages = {
        "auth/email-already-in-use": "This email is already registered. Please log in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Use a stronger password with at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "No account found. Please sign up first.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      };

      setError(messages[err.code] || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">🔄 SkillSwap</div>

        <h1>{isSignup ? "Create your account" : "Welcome back!"}</h1>
        <p>
          {isSignup
            ? "Join students who teach, learn and grow together."
            : "Log in to continue your skill journey."}
        </p>

        {isSignup && (
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              maxLength={60}
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </label>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button className="primary-btn auth-submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isSignup
              ? "Create Account"
              : "Log In"}
        </button>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to SkillSwap?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
}
