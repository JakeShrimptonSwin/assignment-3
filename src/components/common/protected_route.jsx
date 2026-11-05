//Jake S - Protects other routes from being accessed when not logged in.
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../../utils/auth";

function ProtectedRoute({ children }) {
    return isLoggedIn() ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;