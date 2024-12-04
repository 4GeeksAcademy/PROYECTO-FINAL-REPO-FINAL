import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/surveyResults.css";
import { Context } from "../store/appContext";
import ReactECharts from 'echarts-for-react';

const ClosedSurveyView = () => {
    const { id } = useParams();
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [surveyResults, setSurveyResults] = useState(null);
    const [surveyDetails, setSurveyDetails] = useState(null); // Detalles de la encuesta
    const [participantsByQuestion, setParticipantsByQuestion] = useState({}); // Número de votos por pregunta
    const [mostVotedData, setMostVotedData] = useState({}); // Datos de la respuesta más votada
    const [highestVotedQuestion, setHighestVotedQuestion] = useState(null); // Pregunta con más votos

    useEffect(() => {
        if (store.isAuthenticated) {
            fetchSurveyDetails();
            fetchSurveyResults();
        } else {
            alert("Para acceder a los resultados debe iniciar sesión.");
            navigate("/login");
        }
    }, [id, store.isAuthenticated]);

    const fetchSurveyDetails = async () => {
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${id}`, {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                setSurveyDetails(data);
            } else {
                throw new Error("Failed to fetch survey details");
            }
        } catch (error) {
            console.error("Error fetching survey details:", error);
        }
    };

const fetchSurveyResults = async () => {
    try {
        const token = localStorage.getItem("jwt-token");
        if (!token) {
            throw new Error("User not logged in");
        }

        const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${id}/votes`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        // Imprimir detalles del response para depuración
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (response.ok) {
 
            const data = await response.json();
            console.log("Data received:", data);
            setSurveyResults(data);

            const participants = {};
            const mostVoted = {};
            let highestVotes = 0;
            let highestQuestion = null;

            data.questions.forEach((question) => {
                const totalVotes = question.options.reduce(
                    (sum, option) => sum + (option.votes_count || 0),
                    0
                );

                participants[question.question_id] = totalVotes;

                const mostVotedOption = question.options.reduce((max, option) =>
                    option.votes_count > (max?.votes_count || 0) ? option : max,
                    { option_text: "N/A", votes_count: 0 }
                );

                mostVoted[question.question_id] = {
                    text: mostVotedOption?.option_text || "N/A",
                    votes: mostVotedOption?.votes_count || 0,
                    totalVotes,
                };

      
                if (totalVotes > highestVotes) {
                    highestVotes = totalVotes;
                    highestQuestion = {
                        question_text: question.question_text,
                        totalVotes,
                        mostVotedOption,
                    };
                }
            });

            setParticipantsByQuestion(participants);
            setMostVotedData(mostVoted);
            setHighestVotedQuestion(highestQuestion);
        } else {
       
            const text = await response.text();
            console.error("Error response text:", text);
            throw new Error("Failed to fetch survey results");
        }
    } catch (error) {
        console.error("Error fetching survey results:", error);
    }
};


    if (!surveyDetails || !surveyResults) {
        return <div className="loading">Loading survey details and results...</div>;
    }

    if (surveyDetails.status === "closed") {
        const barOptions = surveyResults.questions.map((question) => ({
            title: {
                text: `Responses for: ${question.question_text}`,
                left: 'center',
            },
            xAxis: {
                type: 'category',
                data: question.options.map((opt) => opt.option_text),
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: question.options.map((opt) => opt.votes_count || 0),
                    type: 'bar',
                    showBackground: true,
                    backgroundStyle: {
                        color: 'rgba(220, 220, 220, 0.8)',
                    },
                },
            ],
        }));

        const pieOption = highestVotedQuestion && {
            title: {
                text: `Votes Distribution for: ${highestVotedQuestion.question_text}`,
                left: 'center',
            },
            tooltip: {
                trigger: 'item',
            },
            series: [
                {
                    name: 'Votes',
                    type: 'pie',
                    radius: '50%',
                    data: [
                        { value: highestVotedQuestion.mostVotedOption.votes_count, name: `Most Voted: ${highestVotedQuestion.mostVotedOption.option_text}` },
                        { value: highestVotedQuestion.totalVotes - highestVotedQuestion.mostVotedOption.votes_count, name: 'Other Votes' },
                    ],
                },
            ],
        };

        return (
            <div className="survey-results-container">
                <div className="survey-header">
                    <button className="back-button" onClick={() => navigate("/user_logued")}>← Back to explore surveys</button>
                    <h2 className="survey-title">{surveyDetails.title}</h2>
                </div>
                
                {/* Sección con el resumen de la encuesta después del título */}
                <div className="survey-summary">
                    <p>
                        La encuesta <strong>{surveyDetails.title}</strong>, cuyo objetivo es <strong>{surveyDetails.description}</strong>, 
                        obtuvo los siguientes resultados:
                    </p>
                </div>

                {/* Gráficas */}
                <div className="dashboard-container">
                    {barOptions.map((options, index) => (
                        <div key={index} className="chart-card">
                            <ReactECharts option={options} />
                        </div>
                    ))}
                </div>

                {/* Información detallada de los resultados */}
                <div className="survey-info">
                    {surveyResults.questions.map((question) => (
                        <p key={question.question_id}>
                            Para la pregunta <strong>{question.question_text}</strong>, el número de participantes fue 
                            <strong> {participantsByQuestion[question.question_id]}</strong>. 
                            La respuesta más votada fue <strong>{mostVotedData[question.question_id]?.text}</strong> con 
                            <strong>{mostVotedData[question.question_id]?.votes}</strong> votos de un total de 
                            <strong>{mostVotedData[question.question_id]?.totalVotes}</strong> votos.
                            <br />
                            <br />
                        </p>
                    ))}
                </div>

                {highestVotedQuestion && (
                    <div className="pie-chart-container">
                        <p>
                            La pregunta <strong>{highestVotedQuestion.question_text}</strong> tuvo la respuesta con más usuarios que opinan lo mismo con 
                            <strong> {highestVotedQuestion.mostVotedOption.votes_count}</strong> votos de un total de 
                            <strong> {highestVotedQuestion.totalVotes}</strong> votos.
                        </p>
                        <ReactECharts option={pieOption} />
                    </div>
                )} 

                {/* La encuesta estuvo abierta */}
                <p>
                    La encuesta estuvo abierta desde el día <strong>{surveyDetails.start_date}</strong> hasta el día 
                    <strong>{surveyDetails.end_date}</strong>.
                </p>
            </div>
        );
    }

    return null;
};

export default ClosedSurveyView;
