//Jake S
//navbar removed and turned into a component
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  // Hide navbar on the login page
  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <nav className="navbar">
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/dataGraph">Data Graph</NavLink>
      <NavLink to="/history">History</NavLink>
    </nav>
  );
}

export default Navbar;