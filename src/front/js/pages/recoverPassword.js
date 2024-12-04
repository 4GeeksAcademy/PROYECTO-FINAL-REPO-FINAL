import React, { useState } from "react";
import "../../styles/forgotPassword.css";
import { useNavigate } from "react-router-dom";

export const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/users/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error("Unable to process request. Please check the email address and try again.");
            }

            setMessage("If the email is registered, you will receive password reset instructions.");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="forgot-password-container content-center">
               <div className="jumbotron forgot-header">
                <h2 className="forgot-password-title">
                    SurveyHub
                </h2>
                </div>
                <div className="forgot-password-form-container">
                <h2 className="forgot-password-subtitle">Forgot Your Password?</h2>
                <p className="forgot-password-description">Please enter your email address below to receive instructions on how to reset your password.</p>
                <form onSubmit={handleForgotPassword}>
                    <div className="form-group-placeholder">
                        <input
                            type="email"
                            className="form-control email-input"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn forgot-password-btn" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                    </button>
                </form>
                {message && <div className="message">{message}</div>}
                <button className="btn back-btn" onClick={() => navigate("/login")}>Back to Login</button>
            </div>
        </div>
    );
};

export default ForgotPassword;