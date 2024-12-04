// Login Component
import React, { useState, useContext, useEffect } from "react";
import "../../styles/login.css";
import { useNavigate, Link } from "react-router-dom";
import { Context } from "../store/appContext";
import loginImage from "../../img/login.png";

// Función de login que almacena el token y user_id en localStorage
const performLogin = async (email, password) => {
    try {
        console.log("Enviando email:", email, "y password:", password);

        const resp = await fetch(process.env.BACKEND_URL + "/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: password })
        });

        console.log("Estado de la respuesta:", resp.status);

        if (!resp.ok) {
            if (resp.status === 401) {
                throw new Error("Credenciales inválidas");
            } else if (resp.status === 400) {
                throw new Error("Formato de email o contraseña inválido");
            } else if (resp.status === 405) {
                throw new Error("Método no permitido en el servidor");
            } else {
                throw new Error("Hubo un problema en la solicitud de login");
            }
        }

        const data = await resp.json();
        console.log("Datos de respuesta del login:", data);

        // Almacena el token y el user_id en localStorage
        localStorage.setItem("jwt-token", data.token);
        localStorage.setItem("user_id", data.user_id);

        return data;

    } catch (err) {
        console.error("Error durante el login:", err.message);
        throw err;
    }
};

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const { actions } = useContext(Context);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const data = await performLogin(email, password);
            console.log("Login exitoso:", data.message);
            actions.login(data);                                         // Guarda el token y cambia el estado de autenticación
            navigate("/user_logued");                                    // Redirige al área protegida o a otra página
        } catch (err) {
            setError(err.message);                                       // Mostrar el mensaje de error en la interfaz
        }
    };

    useEffect(() => {
        actions.checkAuth();                                             // Verifica si el usuario sigue autenticado al cargar la página
    }, []);

    return (
        <div className="login-container">
            <img src={loginImage} alt="Login" className="login-image-small" />

            <div className="login-form-container">
                <h1 className="login-title">
                    <span className="highlight-e">Survey</span>
                    <span className="highlight-vote">Hub</span>
                </h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group-placeholder">
                        <input
                            type="email"
                            className="form-control email-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            className="form-control password-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group d-flex justify-content-between">
                        <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
                    </div>
                    <button type="submit" className="btn login-btn">Log in</button>
                </form>
                {error && <div className="error-message">{error}</div>}
                <div className="signup-prompt">
                    Don't have an account? <Link to="/register" className="signup-link">Sign up</Link>
                </div>
            </div>
            <div className="login-image" style={{ backgroundImage: `url(${loginImage})` }}></div>
        </div>
    );
};