// Login handles user authentication.
// It sends login credentials to the FastAPI backend,
// receives a JWT token, stores it in localStorage,
// and redirects the user to the dashboard after login.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeAuthSession } from "../utils/auth.js";
import {
  ArrowRight,
  Lock,
  Mail,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

function Login() {
  // Used for page navigation after successful login
  const navigate = useNavigate();

  // Form input state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Detect Caps Lock warning
  const [capsWarning, setCapsWarning] = useState(false);

  // Error message state
  const [error, setError] = useState("");

  // Loading state during login request
  const [loading, setLoading] = useState(false);

  // Handle all form input changes
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Detect Caps Lock while typing password
  function handlePasswordKey(event) {
    setCapsWarning(event.getModifierState("CapsLock"));
  }

  // Handle login form submission
  async function handleSubmit(event) {
    event.preventDefault();

    // Clear previous errors
    setError("");

    // Basic empty field validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    // Start loading state
    setLoading(true);

    try {
      // Send login request to backend
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // Backend expects username + password
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      // Convert response to JSON
      const data = await response.json();

      // If backend rejects login
      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      // Save JWT token and remembered user data
      storeAuthSession(data.access_token, formData.email, formData.remember);

      // Redirect user after successful login
      navigate("/dashboard");
    } catch (error) {
      // Backend/server connection error
      setError("Could not connect to the backend server.");
    } finally {
      // Stop loading state
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-[560px]">
        <div className="text-center mb-9">
          <div className="mx-auto mb-7 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-500 shadow-sm">
            <Zap size={42} strokeWidth={2.5} />
          </div>

          <h1 className="text-[42px] font-black tracking-[-1.5px] text-slate-950">
            REPORTA AI
          </h1>

          <p className="mt-5 text-[15px] text-slate-500">
            AI-powered football content generation
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[20px] bg-white px-10 py-9 shadow-[0_30px_80px_rgba(15,23,42,0.08)]"
        >
          <h2 className="mb-8 text-center text-[26px] font-bold text-slate-950">
            Welcome Back
          </h2>

          {/* Error message box */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </label>

            <div className="flex h-[54px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <Mail size={21} className="text-slate-400" />

              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@reporta.ai"
                className="h-full w-full border-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="flex h-[54px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <Lock size={21} className="text-slate-400" />

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onKeyUp={handlePasswordKey}
                placeholder="Password"
                className="h-full w-full border-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />

              {/* Show/hide password button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Caps Lock warning */}
            {capsWarning && (
              <p className="mt-2 text-xs text-red-500">
                Warning: Caps Lock is ON
              </p>
            )}
          </div>

          {/* Remember me */}
          <div className="mb-7 flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-600">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Forgot your password?
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-[15px] font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in to Dashboard"}

            {!loading && <ArrowRight size={19} />}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
