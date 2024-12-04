import React, { useContext, useEffect, useRef } from "react";
import "../../styles/home_user_logued.css";
import { Context } from "../store/appContext";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";

export const HomeUserLogued = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const hasFetchedSurveys = useRef(false); // Nueva referencia para verificar si ya se obtuvieron las encuestas

    useEffect(() => {
        // Solo obtener encuestas si no se han obtenido previamente
        if (!hasFetchedSurveys.current) {
            actions.getSurveys();
            actions.getUserProfile(); // Asegurarse de cargar el perfil del usuario
            hasFetchedSurveys.current = true; // Marcar que las encuestas ya se han obtenido
        }
    }, [actions]);

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
                    actions.updateSurveyStatus(id, newStatus);
                });
            }
        }
    }, [store.surveys, actions]);

    return (
        <div className="home-user-logued-container">
            <div className="home-user-logued-background">
                {/* Header Section */}
                <div className="home-user-logued-content mt-5">
                    <div className="home-user-logued-header text-center p-5 mb-4">
                        <h1 className="home-user-logued-title fw-bold">
                            Welcome, {store.user ? store.user.email : "Guest"}!
                        </h1>
                        <h2 className="home-user-logued-subtitle">It's time to create your amazing surveys</h2>
                        <p className="home-user-logued-subtitle">
                            Organize a dinner party, get insight from your users for your small business, and much more.
                        </p>
                        <Link to="/create_survey" className="home-user-logued-create-btn btn-lg mt-3">
                            Create survey
                        </Link>
                    </div>

                    {/* Active Surveys Section */}
                    <section className="home-user-logued-active-section">
                        <h2 className="home-user-logued-section-title mb-4">Your active surveys</h2>
                        <div className="home-user-logued-scroll-container">
                            <div className="home-user-logued-scroll">
                                {store.surveys
                                    .filter(
                                        (survey) =>
                                            store.user && survey.creator_id === store.user.id
                                    )
                                    .map((survey, index) => (
                                        <div key={index} className="col-12 col-lg-6 mb-4">
                                            <div className="home-user-logued-large-card card shadow-sm border-0">
                                                <img
                                                    src="https://placehold.co/1200x400?text=Survey+Image+Placeholder"
                                                    alt="Survey Placeholder"
                                                    className="home-user-logued-survey-img"
                                                />
                                                <div className="home-user-logued-card-body card-body">
                                                    <h4 className="home-user-logued-card-title mb-3">
                                                        {survey.title}
                                                    </h4>
                                                    <p className="home-user-logued-card-text mb-2">
                                                        {survey.description}
                                                    </p>
                                                    <p className="home-user-logued-card-text mb-2">
                                                        <strong>Status:</strong>{" "}
                                                        <span className="home-user-logued-active-badge badge">
                                                            {survey.status}
                                                        </span>
                                                    </p>
                                                    <p className="home-user-logued-card-text mb-2">
                                                        <strong>Responses goal:</strong>{" "}
                                                        {survey.responses_count}/{survey.responses_goal}
                                                    </p>
                                                    <p className="home-user-logued-card-text mb-2">
                                                        <strong>End Date:</strong>{" "}
                                                        {new Date(survey.end_date).toLocaleDateString()}
                                                    </p>
                                                    <div className="d-flex justify-content-end mt-4">
                                                        <Link
                                                            to={`/surveys/${survey.id}`}
                                                            className="home-user-logued-view-details-btn btn-lg"
                                                        >
                                                            View details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <button
                            className="home-user-logued-all-surveys-scroll-btn btn mt-3"
                            onClick={() => navigate(`/surveys/created/${store.user?.id}`)}
                        >
                            View All Created Surveys
                        </button>
                    </section>

                    {/* Open Surveys to Vote Section */}
                    <section className="home-user-logued-popular-section mt-5">
                        <h2 className="home-user-logued-section-title mb-4">Open Surveys to Vote</h2>
                        <div className="home-user-logued-scroll-container">
                            <div className="home-user-logued-scroll">
                                {store.surveys
                                    .filter((survey) => survey.is_public)
                                    .map((survey, index) => (
                                        <div key={index} className="col-12 col-md-6 col-lg-4 mb-4">
                                            <div className="home-user-logued-small-card card shadow-sm border-0">
                                                <img
                                                    src="https://placehold.co/600x400?text=Open+Survey+Placeholder"
                                                    alt="Open Survey Placeholder"
                                                    className="home-user-logued-popular-img"
                                                />
                                                <div className="home-user-logued-popular-body card-body">
                                                    <h5 className="home-user-logued-popular-title">
                                                        {survey.title}
                                                    </h5>
                                                    <p className="home-user-logued-popular-description">
                                                        {survey.description}
                                                    </p>
                                                    <p className="home-user-logued-popular-creator">
                                                        <strong>Creator:</strong>{" "}
                                                        {survey.creator_name || "Anonymous"}
                                                    </p>
                                                    <p className="home-user-logued-popular-end-date">
                                                        <strong>End Date:</strong>{" "}
                                                        {new Date(survey.end_date).toLocaleDateString()}
                                                    </p>
                                                    <Link
                                                        to={`/surveys/${survey.id}`}
                                                        className="home-user-logued-participate-btn btn-sm"
                                                    >
                                                        Participate
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <button
                            className="home-user-logued-all-surveys-scroll-btn btn mt-3"
                            onClick={() => navigate("/surveys")}
                        >
                            View All Surveys
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};
