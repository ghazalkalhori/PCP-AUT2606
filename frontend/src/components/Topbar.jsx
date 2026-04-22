import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';

function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <span>{user?.name || 'Admin'}</span>
      <Button type="button" variant="secondary" onClick={logout}>
        Sign out
      </Button>
    </header>
  );
}

export default Topbar;
