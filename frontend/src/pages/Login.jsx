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
  Loader2,
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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#ecfdf5_0,#f8fafc_38%,#f1f5f9_100%)] flex items-center justify-center px-4 py-6">
      {/* Soft loading overlay gives login a smoother transition */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-2xl">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
            Signing you in...
          </div>
        </div>
      )}
      <section className="w-full max-w-120">
        <div className="text-center mb-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-500 shadow-[0_18px_45px_rgba(16,185,129,0.18)]">
            <Zap size={34} strokeWidth={2.5} />
          </div>

          <h1 className="text-[36px] font-black tracking-[-1.4px] text-slate-950">
            REPORTA AI
          </h1>

          <p className="mt-3 text-[14px] text-slate-500">
            AI-powered football content generation
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[26px] border border-slate-200/80 bg-white/95 px-8 py-7 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur"
        >
          <h2 className="mb-6 text-center text-[24px] font-bold text-slate-950">
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
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </label>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
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
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
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
          <div className="mb-6 flex items-center justify-end gap-4">
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
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-[15px] font-bold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:translate-y-0 disabled:cursor-wait disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking credentials...
              </>
            ) : (
              <>
                Sign in to Dashboard
                <ArrowRight size={19} />
              </>
            )}
          </button>

          <p className="mt-5 text-center text-xs text-slate-400">
            Secure admin access for football content generation
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
