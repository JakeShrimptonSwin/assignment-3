//Jake S
//navbar removed and turned into a component
import { useLocation, NavLink, useNavigate} from "react-router-dom";
import { getUser, clearToken } from '../../utils/auth';
import { Button } from "@mui/material";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  // Hide navbar on the login page
  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <nav className="navbar">
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/dataGraph">Data Graph</NavLink>
      <NavLink to="/history">History</NavLink>
       {user && (
        <div className="navbar-user">
          <span>Logged in as: <strong>{user}</strong></span>
          <Button variant="contained" size="small" onClick={handleLogout}>Logout</Button>        
          </div>
      )}
    </nav>
  );
}

export default Navbar;