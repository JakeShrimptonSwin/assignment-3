//Jake S - Login Form
import { useState } from "react";
import { Box, TextField, Button, Alert} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { setToken, setUser } from "../../utils/auth";

const API_URL = "http://localhost:8000";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

     const handleLogin = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

         try {
             //JAKE S - IMPORTANT : THIS IS THE INSECURE VS SECURE CHANGE HERE. 
             const INSECURE_MODE = false;   // true = vulnerable

             const response = await fetch(
                 `${API_URL}${INSECURE_MODE ? "/login-insecure" : "/login"}`,
                 {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ username, password }),
                 }
             );

            if (response.status === 401) {
                setError("Invalid username or password");
                return;
            }
            if (!response.ok) {
                setError("Login failed. Please try again.");
                return;
            }

             const data = await response.json();
             setToken(data.token);
             setUser(data.username);
             navigate("/home");
        } catch {
            setError("Could not reach the server");
        } finally {
            setLoading(false);
        }
    };

     return (
        <div>
            <Box component="form" onSubmit={handleLogin} sx={{px: 2,}}>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <TextField
                    label="Username"
                    fullWidth
                    required
                    margin="normal"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />

                <TextField
                    label="Password"
                    fullWidth
                    required
                    margin="normal"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? "Logging in..." : "Login"}
                </Button>
            </Box>
        </div>
    );
}

export default LoginForm;