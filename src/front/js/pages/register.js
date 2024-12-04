import React, { useState, useContext } from "react";
import "../../styles/register.css";
import { useNavigate, Link } from "react-router-dom";
import { Context } from "../store/appContext";
import RegisterLogo from "../../img/logoRegister.png";

export const Register = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { actions } = useContext(Context);

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-zA-Z\d]).{8,}$/;
        return regex.test(password);
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        if (!validatePassword(newPassword)) {
            setError("Password requirements: 8 characters, 1 uppercase letter, 1 symbol.");
        } else {
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsSubmitting(false);
            return;
        }

        const newUser = {
            full_name: fullName,
            email: email,
            password: password,
        };

        try {
            const registerResponse = await fetch(process.env.BACKEND_URL + "/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });

            if (registerResponse.ok) {
                const loginResponse = await fetch(process.env.BACKEND_URL + "/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: email, password: password }),
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    localStorage.setItem("jwt-token", loginData.token);
                    localStorage.setItem("user_id", loginData.user_id);
                    actions.login(loginData);
                    alert("Registration and login successful!");
                    navigate("/user_logued");
                } else {
                    const errorData = await loginResponse.json();
                    setError(`Login error: ${errorData.error}`);
                    navigate("/login");
                }
            } else {
                const errorData = await registerResponse.json();
                setError(`Registration error: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError("An issue occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-container">
            <img src={RegisterLogo} alt="Login" className="login-image-small" />
            <div className="register-form-container mt-5 d-flex justify-content-center">
                <h1 className="register-title text-center">
                    <span className="register-e">Survey</span>
                    <span className="register-vote">Hub</span>
                </h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-reg">
                        <label className="form-label"></label>
                        <input
                            placeholder="Full name"
                            type="text"
                            className="form-control register-input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-reg">
                        <label className="form-label"></label>
                        <input
                            placeholder="Email"
                            type="email"
                            className="form-control register-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-reg">
                        <label className="form-label"></label>
                        <input
                            placeholder="Password"
                            type="password"
                            className="form-control register-input"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>
                    <div className="input-reg">
                        <label className="form-label"></label>
                        <input
                            placeholder="Confirm password"
                            type="password"
                            className="form-control register-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="btn btn-lg register-btn" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Create account"}
                    </button>
                    <div className="login-register">
                        Do you already have an account? <Link to="/login" className="signup-link">Log in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};


