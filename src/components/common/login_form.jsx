//Jake S - Login Form
import { useState } from "react";
import { Box, TextField, Button, } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (event) => {
        event.preventDefault();

        // Add login authentication here
        console.log("Login submitted");
        navigate("/home")
    };

    return (
        <div>

            <Box component="form" onSubmit={handleLogin}>
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
                    type="password"
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
                    sx={{ mt: 2 }}
                >
                    Login
                </Button>
            </Box>
        </div>);
}

export default LoginForm;