import { useNavigate } from 'react-router-dom';
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
