import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';
import { useNavigate } from 'react-router-dom';

function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="topbar">
      <span>{user?.name || 'Admin'}</span>
      <Button type="button" variant="secondary" onClick={handleLogout}>
        Sign out
      </Button>
    </header>
  );
}

export default Topbar;
