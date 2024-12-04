import React, { useContext, useEffect, useRef } from 'react';
import "../../styles/dashboard.css";
import { Context } from '../store/appContext';
import { Link, useNavigate } from 'react-router-dom';
import moment from "moment";
import { IoMdEye } from "react-icons/io";
import { FaCirclePlus } from "react-icons/fa6";

const UserDashboard = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const hasFetchedSurveys = useRef(false); // Nueva referencia para verificar si ya se obtuvieron las encuestas

    useEffect(() => {
        // Solo obtener encuestas si no se han obtenido previamente
        const fetchData = async () => {
            if (!hasFetchedSurveys.current) {
                try {
                    await actions.getSurveys();
                    await actions.getUserProfile(); // Asegurarse de cargar el perfil del usuario
                    if (store.user) {
                        await actions.getUserVotedSurveys(store.user.id); // Cargar las encuestas votadas por el usuario
                    }
                    hasFetchedSurveys.current = true; // Marcar que las encuestas ya se han obtenido
                } catch (error) {
                    console.error("Error fetching surveys or user profile", error);
                }
            }
        };

        if (store.isAuthenticated) {
            fetchData();
        }
    }, [actions, store.isAuthenticated, store.user]);

    useEffect(() => {
        // Actualizar el estado de las encuestas según las fechas
        if (store.surveys && store.surveys.length > 0) {
            const surveysToUpdate = [];
            store.surveys.forEach((survey) => {
                const currentDate = moment();
                const startDate = moment(survey.start_date);
                const endDate = moment(survey.end_date);

                let newStatus = survey.status;

                if (currentDate.isBefore(startDate)) {
                    newStatus = "draft";
                } else if (currentDate.isBetween(startDate, endDate, undefined, "[]")) {
                    newStatus = "active";
                } else if (currentDate.isAfter(endDate)) {
                    newStatus = "closed";
                }

                if (newStatus !== survey.status) {
                    surveysToUpdate.push({ id: survey.id, newStatus });
                }
            });

            // Actualizar solo las encuestas que han cambiado de estado
            if (surveysToUpdate.length > 0) {
                surveysToUpdate.forEach(({ id, newStatus }) => {
                    const token = localStorage.getItem("jwt-token");
                    actions.updateSurveyStatus(id, newStatus, token);
                });
            }
        }
    }, [store.surveys, actions]);

    const handleSurveyClick = (id) => {
        navigate(`/surveys/${id}`);
    };

    const getLimitedSurveys = (surveys, limit) => {
        return surveys.slice(0, limit);
    };

    const truncateText = (text, maxLength) => {
        if (text.length > maxLength) {
            return text.slice(0, maxLength) + "...";
        }
        return text;
    };

    const activeSurveys = store.surveys && store.user ?
        store.surveys.filter(survey => survey.status === 'active' && survey.creator_id === store.user.id) : [];

    const pastSurveys = store.surveys && store.user ?
        store.surveys.filter(survey => survey.status === 'closed' && survey.creator_id === store.user.id) : [];

    const recentVotedSurveys = store.userVotedSurveys || [];

    if (!store.isAuthenticated) {
        return <div className="loading">Please log in to view your dashboard...</div>;
    }

    if (!store.user || !store.surveys || store.surveys.length === 0) {
        return <div className="loading">Loading your dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header jumbotron">
                <div className="header-content">
                    <div className="user-info">
                        <img className="user-avatar" src="https://i.pravatar.cc/" alt="User Avatar" />
                        <div className="user-details">
                            <h1>Welcome {store.user?.full_name || "Guest"}</h1>
                            <p className="user-role">Survey expert</p>
                            <Link to="/profile" className="edit-profile">Edit Profile</Link>
                            <Link to="/create_survey" className="btn btn-create-profile">Create Survey</Link>
                        </div>
                    </div>
                    <div className="annual-interactions">
                        <div className="progress-ring">
                            <h2>{recentVotedSurveys.length}</h2>
                        </div>
                        
                        <p>Surveys voted</p>
                    </div>
                </div>
                <div className="user-stats">
                    <div className="stat-item">
                        <p className="stat-title"><IoMdEye /> Survey Votes</p>
                        <h2 className="stat-value">
                            {store.surveys.filter(survey => survey.creator_id === store.user?.id && survey.currentResponses != null).reduce((total, survey) => total + survey.currentResponses, 0)}
                        </h2>
                    </div>
                    <div className="stat-item">
                        <p className="stat-title"><FaCirclePlus /> Surveys Created</p>
                        <h2 className="stat-value">
                            {store.surveys.filter(survey => survey.creator_id === store.user?.id).length}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Sección de encuestas activas */}
            <div className="active-surveys">
                <div className="dash-surv-header">
                    <h2>Your active surveys</h2>
                    {activeSurveys.length >= 0 && (
                        <button
                            className="dash-link"
                            onClick={() => navigate('/surveys')}
                        >
                            Explore all surveys
                        </button>
                    )}
                </div>

                <div className="survey-list">
                    {getLimitedSurveys(activeSurveys, 3).map((survey, index) => (
                        <div key={index} className="survey-card" onClick={() => handleSurveyClick(survey.id)}>
                            <img src={`https://picsum.photos/600/400?random=${survey.id}`} alt="Survey" className='survey-dash-image' />
                            <div className={`available-survey-status-header ${survey.is_public ? 'public' : 'private'}`}>
                                {survey.is_public ? 'Public' : 'Private'}
                            </div>
                            <div className="card-dash-body">
                                <h3>{truncateText(survey.title, 50)}</h3>
                                <p className='dash-body-text'>{truncateText(survey.description, 110)}</p>
                                <div className="available-dash-card-footer">
                                    <p className="available-dash-card-dates">
                                        Available until: {new Date(survey.end_date).toLocaleDateString()}
                                    </p>
                                    <div className="available-survey-goal">
                                        Responses goal: <br /><span>{survey.currentResponses} of {survey.totalResponses}</span>
                                        <img src="https://i.pravatar.cc/" alt="Creator" className="available-survey-creator-avatar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sección de encuestas pasadas */}
            <div className="past-surveys">
                <div className="dash-surv-header">
                    <h2>Explore your past surveys</h2>
                    {pastSurveys.length >= 0 && (
                        <button
                            className="dash-link"
                            onClick={() => navigate('/surveys')}
                        >
                            Explore more
                        </button>
                    )}
                </div>

                <div className="survey-list">
                    {getLimitedSurveys(pastSurveys, 3).map((survey, index) => (
                        <div key={index} className="survey-card" onClick={() => handleSurveyClick(survey.id)}>
                            <img src={`https://picsum.photos/600/400?random=${survey.id}`} alt="Survey" className='survey-dash-image' />
                            <div className={`available-survey-status-header ${survey.is_public ? 'public' : 'private'}`}>
                                {survey.is_public ? 'Public' : 'Private'}
                            </div>
                            <div className="card-dash-body">
                                <h3>{truncateText(survey.title, 50)}</h3>
                                <p className='dash-body-text'>{truncateText(survey.description, 110)}</p>
                                <div className="available-dash-card-footer">
                                    <p className="available-dash-card-dates">
                                        Closed on: {new Date(survey.end_date).toLocaleDateString()}
                                    </p>
                                    <div className="available-survey-goal">
                                        Responses goal: <br /><span>{survey.currentResponses} of {survey.totalResponses}</span>
                                        <img src="https://i.pravatar.cc/" alt="Creator" className="available-survey-creator-avatar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sección de encuestas votadas recientemente */}
            <div className="recent-voting">
                <div className="dash-surv-header">
                    <h2>What have you been voting on recently?</h2>
                    {recentVotedSurveys.length >= 0 && (
                        <button
                            className="dash-link"
                            onClick={() => navigate('/surveys')}
                        >
                            Explore more
                        </button>
                    )}
                </div>

                <div className="survey-list">
                    {getLimitedSurveys(recentVotedSurveys, 3).map((survey, index) => (
                        <div key={index} className="survey-card" onClick={() => handleSurveyClick(survey.id)}>
                            <img src={`https://picsum.photos/600/400?random=${survey.id}`} alt="Survey" className='survey-dash-image' />
                            <div className={`available-survey-status-header ${survey.is_public ? 'public' : 'private'}`}>
                                {survey.is_public ? 'Public' : 'Private'}
                            </div>
                            <div className="card-dash-body">
                                <h3>{truncateText(survey.title, 50)}</h3>
                                <p className='dash-body-text'>{truncateText(survey.description, 110)}</p>
                                <div className="available-dash-card-footer">
                                    <p className="available-dash-card-dates">
                                        Last voted on: {new Date(survey.end_date).toLocaleDateString()}
                                    </p>
                                    <div className="available-survey-goal">
                                        Responses goal: <br /><span>{survey.currentResponses} of {survey.totalResponses}</span>
                                        <img src="https://i.pravatar.cc/" alt="Creator" className="available-survey-creator-avatar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;