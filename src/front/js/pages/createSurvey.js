// CreateSurvey Component
import React, { useState, useEffect, useContext } from "react";
import "../../styles/createSurvey.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";

export const CreateSurvey = () => {
    const { store, actions } = useContext(Context);
    const [user, setUser] = useState(store.user);
    const [surveyData, setSurveyData] = useState({
        creator_id: user?.id || "",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        is_public: true,
        status: "draft",
        type: "survey",
        questions: []
    });
    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: "",
        question_type: "multiple_choice",
        required: true,
        options: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!store.isAuthenticated) {
            alert("User not logged in");
            navigate("/login");
        } else if (!store.user) {
            actions.getUserProfile().then(() => {
                setUser(store.user);
            });
        } else {
            setUser(store.user);
            setSurveyData((prevSurveyData) => ({
                ...prevSurveyData,
                creator_id: store.user?.id || ""
            }));
        }
    }, [store.isAuthenticated, store.user, navigate, actions]);

    const handleSurveyChange = (e) => {
        const { name, value } = e.target;
        setSurveyData({ ...surveyData, [name]: value });
    };

    const handleAddQuestion = () => {
        if (currentQuestion.question_text.trim() !== "") {
            setSurveyData({
                ...surveyData,
                questions: [...surveyData.questions, { ...currentQuestion, order: surveyData.questions.length + 1 }]
            });
            setCurrentQuestion({ question_text: "", question_type: "multiple_choice", required: true, options: [] });
        } else {
            alert("Please enter a valid question text.");
        }
    };

    const handleAddOption = (optionText) => {
        if (optionText.trim() !== "") {
            setCurrentQuestion({
                ...currentQuestion,
                options: [...currentQuestion.options, { option_text: optionText, order: currentQuestion.options.length + 1 }]
            });
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${localStorage.getItem("jwt-token")}`);

        const updatedSurveyData = {
            ...surveyData,
            creator_id: user?.id,
            questions: surveyData.questions.map((q, index) => ({
                ...q,
                order: index + 1,
                options: q.options.map((opt, optIndex) => ({
                    ...opt,
                    order: optIndex + 1
                }))
            }))
        };

        const raw = JSON.stringify(updatedSurveyData);

        console.log("Submitting survey data:", updatedSurveyData);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            const response = await fetch(process.env.BACKEND_URL + "/api/surveys/full", requestOptions);
            const data = await response.json();

            if (response.ok) {
                if (data.survey && data.survey.survey_id) {
                    navigate(`/surveyS/${data.survey.survey_id}`);
                } else {
                    console.error("Survey ID is missing in the response.");
                    alert("Survey was created, but the Survey ID is missing in the response.");
                }
            } else {
                console.error("Error:", data.message || "An unexpected error occurred.");
                alert(`Error: ${data.message || "An unexpected error occurred."}`);
            }
        } catch (error) {
            console.error("Error sending data:", error);
            alert("An error occurred while sending the data. Please check the server logs for more details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-survey-container">
            <div className="container mt-5">
                <div className="jumbotron text-center p-5 mb-4 header-section">
                    <h2 className="display-5 fw-bold">Create a New Survey</h2>
                </div>

                <div className="card shadow-sm border-0 mb-4 create-survey-card">
                    <form>
                        <h4>Survey Details</h4>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Survey Title</label>
                            <input
                                type="text"
                                className="form-control create-survey-input"
                                name="title"
                                value={surveyData.title}
                                onChange={handleSurveyChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Description</label>
                            <textarea
                                className="form-control create-survey-input"
                                name="description"
                                value={surveyData.description}
                                onChange={handleSurveyChange}
                                required
                            ></textarea>
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Start Date</label>
                            <input
                                type="date"
                                className="form-control create-survey-input"
                                name="start_date"
                                value={surveyData.start_date}
                                onChange={handleSurveyChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">End Date</label>
                            <input
                                type="date"
                                className="form-control create-survey-input"
                                name="end_date"
                                value={surveyData.end_date}
                                onChange={handleSurveyChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Survey Status</label>
                            <select
                                className="form-select create-survey-input"
                                name="status"
                                value={surveyData.status}
                                onChange={handleSurveyChange}
                                required
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Public Survey?</label>
                            <div>
                                <label className="form-check-label">
                                    <input
                                        type="radio"
                                        name="is_public"
                                        checked={surveyData.is_public === true}
                                        onChange={() => setSurveyData({ ...surveyData, is_public: true })}
                                    />
                                    Yes
                                </label>
                                <label className="form-check-label ms-4">
                                    <input
                                        type="radio"
                                        name="is_public"
                                        checked={surveyData.is_public === false}
                                        onChange={() => setSurveyData({ ...surveyData, is_public: false })}
                                    />
                                    No
                                </label>
                            </div>
                        </div>

                        <h4 className="mt-5">Add Questions</h4>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Question Text</label>
                            <input
                                type="text"
                                className="form-control create-survey-input"
                                value={currentQuestion.question_text}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Question Type</label>
                            <select
                                className="form-select create-survey-input"
                                value={currentQuestion.question_type}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_type: e.target.value })}
                                required
                            >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="yes_no">Yes/No (Unique Choice)</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label form-label-create">Add Options (for Multiple Choice and Yes/No)</label>
                            <input
                                type="text"
                                className="form-control create-survey-input"
                                placeholder="Enter an option and press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.target.value.trim() !== "") {
                                        handleAddOption(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                            />
                            <ul className="mt-2">
                                {currentQuestion.options.map((option, index) => (
                                    <li key={index}>{option.option_text}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-primary w-100 create-survey-btn"
                                onClick={handleAddQuestion}
                            >
                                Add Question
                            </button>
                        </div>

                        <h4 className="mt-5">Review and Submit</h4>
                        <div className="mb-3">
                            <strong>Title: </strong>{surveyData.title}
                        </div>
                        <div className="mb-3">
                            <strong>Description: </strong>{surveyData.description}
                        </div>
                        <div className="mb-3">
                            <strong>Start Date: </strong>{surveyData.start_date}
                        </div>
                        <div className="mb-3">
                            <strong>End Date: </strong>{surveyData.end_date}
                        </div>
                        <div className="mb-3">
                            <strong>Status: </strong>{surveyData.status}
                        </div>
                        <div className="mb-3">
                            <strong>Public: </strong>{surveyData.is_public ? "Yes" : "No"}
                        </div>
                        <div className="mb-3">
                            <h5>Questions:</h5>
                            <ul>
                                {surveyData.questions.map((q, index) => (
                                    <li key={index}>
                                        <strong>Question {index + 1}: </strong>{q.question_text}
                                        <ul>
                                            {q.options.map((option, optionIndex) => (
                                                <li key={optionIndex}>{option.option_text}</li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                className="btn btn-success w-100 create-survey-btn"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Survey"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};