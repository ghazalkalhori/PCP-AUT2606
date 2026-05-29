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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [capsWarning, setCapsWarning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordKey(event) {
    setCapsWarning(event.getModifierState("CapsLock"));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // FastAPI returns a JWT that utils/auth stores for protected API requests.
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      storeAuthSession(data.access_token, formData.email, false);
      navigate("/dashboard");
    } catch (error) {
      setError("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-6">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-2xl">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
            Signing you in...
          </div>
        </div>
      )}

      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-500 shadow-xl">
            <Zap size={34} strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            REPORTA AI
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            AI-powered football content generation
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white px-8 py-7 shadow-xl"
        >
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-950">
            Welcome Back
          </h2>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

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
                className="h-full w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mb-6">
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
                className="h-full w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {capsWarning && (
              <p className="mt-2 text-xs text-red-500">
                Warning: Caps Lock is ON
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-75"
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
