import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pendingSurveyView.css"; // Asegúrate de usar la ruta correcta

const PendingSurveyView = ({
    survey,
    isCreator,
    isEditing,
    handleToggleEdit,
    handleSaveChanges,
    handleSurveyChange,
    handleQuestionChange,
    handleOptionChange,
}) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!survey || survey.status !== "draft" || !survey.start_date) return;

        const startTime = new Date(survey.start_date).getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const timeDifference = startTime - now;

            if (timeDifference <= 0) {
                setTimeLeft(null);
            } else {
                setTimeLeft(timeDifference);
            }
        };

        updateCountdown();
        const intervalId = setInterval(updateCountdown, 1000);

        return () => clearInterval(intervalId);
    }, [survey]);

    const formatTime = (time) => {
        const days = Math.floor(time / (1000 * 60 * 60 * 24));
        const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((time % (1000 * 60)) / 1000);

        return `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`;
    };

    if (!survey) {
        return <div className="loading">Loading survey data...</div>;
    }

    return (
        <div className="pending-survey-container">
            <h2 className="survey-title">
                {isEditing ? (
                    <input
                        type="text"
                        className="survey-title-input"
                        value={survey.title}
                        onChange={(e) => handleSurveyChange("title", e.target.value)}
                    />
                ) : (
                    survey.title
                )}
            </h2>
            <p className="survey-description">
                {isEditing ? (
                    <textarea
                        className="survey-description-input"
                        value={survey.description}
                        onChange={(e) => handleSurveyChange("description", e.target.value)}
                    ></textarea>
                ) : (
                    survey.description
                )}
            </p>
            <div className="survey-questions">
                {survey.questions.map((question, questionIndex) => (
                    <div key={question.id} className="question-container">
                        {isEditing ? (
                            <input
                                type="text"
                                className="question-input"
                                value={question.question_text}
                                onChange={(e) => handleQuestionChange(questionIndex, "question_text", e.target.value)}
                            />
                        ) : (
                            <h4 className="question-text">
                                {questionIndex + 1}. {question.question_text}
                            </h4>
                        )}
                        <ul className="options-container">
                            {question.options.map((option, optionIndex) => (
                                <li key={option.id} className="option">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={option.option_text}
                                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                                        />
                                    ) : (
                                        <span className="option-label">&#8226; {option.option_text}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            {timeLeft !== null ? (
                <div className="countdown-container">
                    <p>Time left to start the survey:</p>
                    <p className="countdown-timer">{formatTime(timeLeft)}</p>
                </div>
            ) : (
                <p className="status-message">The survey is now active!</p>
            )}
            <button className="back-button" onClick={() => navigate("/user_logued")}>
                ← Back to explore surveys
            </button>
            {isCreator && (
                <div className="creator-actions">
                    <button className="edit-btn" onClick={handleToggleEdit}>
                        {isEditing ? "Cancel" : "Edit Survey"}
                    </button>
                    {isEditing && (
                        <button className="save-btn" onClick={handleSaveChanges}>
                            Save Changes
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PendingSurveyView;
