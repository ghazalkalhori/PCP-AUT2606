/*import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import FormInput from '../components/FormInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(event) {
    event.preventDefault();
    login({ name: 'Admin User', role: 'admin' });
    navigate('/dashboard');
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Reporta AI</h1>
        <FormInput id="email" label="Email" type="email" placeholder="admin@example.com" />
        <FormInput id="password" label="Password" type="password" placeholder="Password" />
        <Button type="submit">Sign in</Button>
      </form>
    </main>
  );
}

export default Login;
*/
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: 'admin@reporta.ai',
    password: 'password123',
    remember: false,
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  
  function handleSubmit(event) {
    event.preventDefault();

    const validEmail = 'admin@reporta.ai';
    const validPassword = 'password123';

    if (formData.email !== validEmail || formData.password !== validPassword) {
      alert('Invalid email or password');
      return;
    }

    login({
      name: 'Admin User',
      role: 'admin',
      email: formData.email,
    });

    navigate('/dashboard');
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

          <div className="mb-6">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>

            <div className="flex h-[54px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <Mail size={21} className="text-slate-400" />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@reporta.ai"
                className="h-full w-full border-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div className="flex h-[54px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <Lock size={21} className="text-slate-400" />

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="h-full w-full border-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

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

          <button
            type="submit"
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-[15px] font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Sign in to Dashboard
            <ArrowRight size={19} />
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;