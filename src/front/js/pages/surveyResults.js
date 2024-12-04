import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/surveyResults.css";
import { Context } from "../store/appContext";
import moment from "moment";
import PendingSurveyView from "../component/pendingSurveyView"; // Importación de PendingSurveyView
import ClosedSurveyView from "../component/closedSurveyView"; // Importación de ClosedSurveyView

export const SurveyResults = () => {
    const { id } = useParams();
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [isFormValid, setIsFormValid] = useState(false);
    const [responses, setResponses] = useState({});
    const [hasVoted, setHasVoted] = useState(true); // Deshabilitado por defecto
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Controla el modo edición
    const [editableSurvey, setEditableSurvey] = useState(null); // Copia editable de la encuesta

    // Fetch survey data
    useEffect(() => {
        const fetchData = async () => {
            if (!store.user) {
                await actions.getUserProfile(); // Cargar el perfil del usuario
            }
            if (!store.survey || store.survey.id !== parseInt(id)) {
                await actions.getSurvey(id); // Cargar la encuesta
            }
            if (store.survey && store.user) {
                setEditableSurvey({ ...store.survey }); // Configurar la encuesta editable
            }
        };

        fetchData();
    }, [store.user, store.survey, id, actions]);

    // Check if the user has voted
    useEffect(() => {
        const checkIfVoted = async () => {
            if (!store.user || !store.isAuthenticated) return;

            if (!store.userVotedSurveys) {
                const votedSurveys = await actions.getUserVotedSurveys(store.user.id);
                if (!votedSurveys) return;
            }

            const voted = store.userVotedSurveys.some((survey) => survey.id === parseInt(id));
            setHasVoted(voted);

            if (voted) {
                setShowModal(true);
            }
        };

        checkIfVoted();
    }, [store.user, store.isAuthenticated, store.userVotedSurveys, id, actions]);

    // Update survey status based on dates
    useEffect(() => {
        if (store.survey) {
            const currentDate = moment();
            const startDate = moment(store.survey.start_date);
            const endDate = moment(store.survey.end_date);

            let newStatus = store.survey.status;

            if (currentDate.isBefore(startDate)) {
                newStatus = "draft";
            } else if (currentDate.isBetween(startDate, endDate, undefined, "[]")) {
                newStatus = "active";
            } else if (currentDate.isAfter(endDate)) {
                newStatus = "closed";
            }

            if (newStatus !== store.survey.status) {
                actions.updateSurveyStatus(id, newStatus);
            }
        }
    }, [store.survey, actions, id]);

    // Validate form before submission
    useEffect(() => {
        if (store.survey && store.survey.questions) {
            validateForm();
        }
    }, [store.survey, responses]);

    const validateForm = () => {
        if (!store.survey || !store.survey.questions) {
            setIsFormValid(false);
            return;
        }

        const allQuestionsAnswered = store.survey.questions.every((question) => {
            if (question.question_type === "open_ended") {
                return responses[question.id] && responses[question.id].trim() !== "";
            } else {
                return responses[question.id] !== undefined;
            }
        });

        setIsFormValid(allQuestionsAnswered);
    };

    const handleBack = () => {
        navigate("/user_logued");
    };

    const handleInputChange = (questionId, value) => {
        setResponses((prevResponses) => ({
            ...prevResponses,
            [questionId]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!isFormValid) {
            alert("Please ensure all questions are answered before submitting.");
            return;
        }

        try {
            const token = localStorage.getItem("jwt-token");
            if (!token) {
                alert("Para votar debe hacer login");
                return;
            }

            const votesData = Object.entries(responses).map(([questionId, optionId]) => ({
                option_id: parseInt(optionId),
            }));

            for (let vote of votesData) {
                const response = await fetch(`${process.env.BACKEND_URL}/api/votes`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(vote),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Response error:", errorText);
                    throw new Error(`Failed to submit vote for option ${vote.option_id}`);
                }
            }

            alert("Thank you for your responses!");
            navigate("/user_logued");
        } catch (error) {
            console.error("Error submitting responses:", error);
            alert("Failed to submit your responses. Please try again.");
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleToggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleSurveyChange = (field, value) => {
        setEditableSurvey({
            ...editableSurvey,
            [field]: value,
        });
    };

    const handleQuestionChange = (questionIndex, field, value) => {
        const updatedQuestions = [...editableSurvey.questions];
        updatedQuestions[questionIndex][field] = value;
        setEditableSurvey({
            ...editableSurvey,
            questions: updatedQuestions,
        });
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        const updatedQuestions = [...editableSurvey.questions];
        updatedQuestions[questionIndex].options[optionIndex].option_text = value;
        setEditableSurvey({
            ...editableSurvey,
            questions: updatedQuestions,
        });
    };

    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem("jwt-token");
            const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/full`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editableSurvey),
            });

            if (response.ok) {
                alert("Survey updated successfully!");
                setIsEditing(false);
                await actions.getSurvey(id);
            } else {
                alert("Failed to save changes.");
            }
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    const handleDeleteSurvey = async () => {
        try {
            const token = localStorage.getItem("jwt-token");
            const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert("Survey deleted successfully!");
                navigate("/user_logued"); // Redirigir después de eliminar
            } else {
                const errorData = await response.json();
                alert(`Error deleting survey: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error deleting survey:", error);
            alert("Failed to delete the survey.");
        }
    };

    if (!editableSurvey) {
        return <div className="loading">Loading survey details...</div>;
    }

    const isCreator = store.user?.id === editableSurvey.creator_id;

    // Renderización condicional basado en el estado de la encuesta
    if (editableSurvey.status === "draft") {
        return (
            <PendingSurveyView 
                survey={editableSurvey} 
                isCreator={isCreator} 
                isEditing={isEditing} 
                handleToggleEdit={handleToggleEdit}
                handleSaveChanges={handleSaveChanges}
                handleSurveyChange={handleSurveyChange}
                handleQuestionChange={handleQuestionChange}
                handleOptionChange={handleOptionChange}
            />
        );
    } else if (editableSurvey.status === "closed") {
        return <ClosedSurveyView survey={editableSurvey} />;
    }

    return (
        <div className="survey-results-container">
            <div className="survey-header">
                <button className="back-button" onClick={handleBack}>
                    ← Back to explore surveys
                </button>
                <h2 className="survey-title">{editableSurvey.title}</h2>
                <p className="survey-description">{editableSurvey.description}</p>
            </div>

            <div className="survey-questions">
                {editableSurvey.questions.map((question, questionIndex) => (
                    <div key={question.id} className="question-container">
                        <h4 className="question-text">
                            {questionIndex + 1}. {question.question_text}
                        </h4>
                        <div className="options-container">
                            {question.options.map((option, optionIndex) => (
                                <div key={option.id} className="option">
                                    <input
                                        type={
                                            question.question_type === "multiple_choice"
                                                ? "checkbox"
                                                : "radio"
                                        }
                                        name={`question-${question.id}`}
                                        value={option.id}
                                        onChange={() =>
                                            handleInputChange(question.id, option.id)
                                        }
                                        disabled={!store.isAuthenticated || hasVoted}
                                    />
                                    <label>{option.option_text}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {!isEditing && (
                <button
                    className={`btn submit-btn ${
                        isFormValid && store.isAuthenticated && !hasVoted ? "enabled" : ""
                    }`}
                    onClick={handleSubmit}
                    disabled={!isFormValid || !store.isAuthenticated || hasVoted}
                >
                    {hasVoted ? "Ya has votado en esta encuesta" : "Submit my responses"}
                </button>
            )}

            {isCreator && (
                <button className="delete-btn" onClick={handleDeleteSurvey}>
                    Delete Survey
                </button>
            )}

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>¡Ya has votado en esta encuesta!</h2>
                        <button onClick={closeModal}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
