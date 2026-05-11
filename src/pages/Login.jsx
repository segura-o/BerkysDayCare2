import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setErrorMessage("Login failed. Please check your email and password.");
        }
    };

    return (
        <div className="app-container">
            <div className="modal-card">
                <h2>🌈 Worker Login</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="email"
                        placeholder="Worker email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">Login</button>
                </form>

                {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            </div>
        </div>
    );
}

export default Login;