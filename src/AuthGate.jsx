
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import "./Auth.css";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(credential.user, {
          displayName: name.trim(),
        });
        setUser({ ...credential.user, displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "This email is already registered. Please log in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Use a password with at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/network-request-failed": "Network error. Please try again.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };

      setError(
        messages[err.code] ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
  }

  if (checking) {
    return <div className="auth-loading">Loading SkillSwap...</div>;
  }

  if (user) {
    return (
      <div className="authenticated-app">
        <div className="auth-user-bar">
          <span>
            Signed in as <strong>{user.displayName || user.email}</strong>
          </span>
          <button onClick={handleLogout} className="auth-logout">
            Logout
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">🔄 SkillSwap</div>
        <h1>{isSignup ? "Create your account" : "Welcome back!"}</h1>
        <p className="auth-subtitle">
          Learn, teach and grow together.
        </p>

        {isSignup && (
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={60}
              required
            />
          </label>
        )}

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? "Please wait..." : isSignup ? "Create Account" : "Login"}
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
            {isSignup ? "Login" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
}
