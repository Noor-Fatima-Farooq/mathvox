import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard, {
  AuthButton,
  AuthInput,
  AuthLink,
  AuthPasswordInput,
} from "../components/AuthCard";
import { setUserProfile } from "../services/chatStorage";
import { loginUser, resendVerification } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    if (userId) {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/chat", { replace: true });
      }
    }
  }, [navigate]);

  const finishAuth = (data) => {
    const userId = data.user_id;
    const role = data.role || "user";

    // Save login information
    localStorage.setItem("user_id", String(userId));
    localStorage.setItem("role", role);

    // Save user profile
    setUserProfile({
      name: data.name || "",
      username: data.username || "",
      email: data.email || "",
    });

    // Redirect according to role
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/chat", { replace: true });
    }
  };

  const handleLogin = async () => {
    setError("");
    setInfo("");
    setShowResend(false);

    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);

      if (data.user_id) {
        finishAuth(data);
      } else {
        const msg = data.error || data.detail || "Invalid credentials";

        setError(msg);

        if (
          msg.toLowerCase().includes("confirm") ||
          msg.toLowerCase().includes("verify")
        ) {
          setShowResend(true);
        }
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setInfo("");
    setError("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);

    try {
      const data = await resendVerification(email.trim());

      setInfo(data.message || "Confirmation email sent.");
      setShowResend(false);
    } catch (err) {
      setError(err.message || "Could not resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in with the email and password you chose at sign up"
      footer={
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          New here? <AuthLink to="/signup">Create an account</AuthLink>
        </p>
      }
    >
      <AuthInput
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <AuthPasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleLogin();
          }
        }}
      />

      <p className="text-right text-sm mb-4 -mt-2">
        <AuthLink to="/forgot-password">Forgot password?</AuthLink>
      </p>

      {error && (
        <p className="text-sm text-red-500 mb-2 text-center">
          {error}
        </p>
      )}

      {info && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-2 text-center">
          {info}
        </p>
      )}

      {showResend && (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="w-full text-sm text-indigo-600 dark:text-indigo-400 mb-3 hover:underline"
        >
          Resend confirmation email
        </button>
      )}

      <AuthButton onClick={handleLogin} disabled={loading}>
        {loading ? "Signing in…" : "Log in"}
      </AuthButton>
    </AuthCard>
  );
}