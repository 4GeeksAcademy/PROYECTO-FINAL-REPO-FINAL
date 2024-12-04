import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const InviteUsers = () => {
    const [emails, setEmails] = useState([]);
    const [currentEmail, setCurrentEmail] = useState("");
    const { surveyId } = useParams(); // Capturar survey_id desde la URL
    const navigate = useNavigate();

    const handleAddEmail = () => {
        if (currentEmail.trim() !== "") {
            setEmails([...emails, currentEmail.trim()]);
            setCurrentEmail("");
        }
    };

    const handleSendInvitations = async () => {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Bearer ${localStorage.getItem("jwt-token")}`);

            const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${surveyId}/invite`, {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify({ emails })
            });

            if (response.ok) {
                alert("Invitations sent successfully!");
                navigate("/dashboard");
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error("Error sending invitations:", error);
            alert("An error occurred while sending the invitations.");
        }
    };

    return (
        <div className="invite-users-container">
            <h2>Invite Users to Survey</h2>
            <input
                type="email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                placeholder="Enter email address"
            />
            <button onClick={handleAddEmail}>Add Email</button>

            <ul>
                {emails.map((email, index) => (
                    <li key={index}>{email}</li>
                ))}
            </ul>

            <button onClick={handleSendInvitations}>Send Invitations</button>
        </div>
    );
};

export default InviteUsers;
