import React, { useEffect, useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/surveys.css";
import { Context } from "../store/appContext";
import { IoMdSearch } from "react-icons/io";
import moment from "moment";

export const AvailableSurveys = () => {
    const { store, actions } = useContext(Context);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
    const [filterStatus, setFilterStatus] = useState("active"); // Estado para el filtro de estado
    const [showOnlyUserSurveys, setShowOnlyUserSurveys] = useState(
        JSON.parse(sessionStorage.getItem("showOnlyUserSurveys")) || false // Cargar el estado desde sessionStorage
    );
    const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual
    const surveysPerPage = 12; // Número máximo de encuestas por página
    const navigate = useNavigate();
    const hasFetchedUserSurveys = useRef(false); // Referencia para verificar si ya se obtuvieron las encuestas
    const hasFetchedSurveys = useRef(false); // Referencia para evitar un bucle infinito de solicitudes

    useEffect(() => {
        if (!hasFetchedSurveys.current) {
            actions.getSurveys();
            hasFetchedSurveys.current = true;
        }
    }, [actions]);

    useEffect(() => {
        if (store.user && !hasFetchedUserSurveys.current) {
            actions.getUserSurveys(store.user.id);
            hasFetchedUserSurveys.current = true;
        }
    }, [store.user, actions]);

    useEffect(() => {
        sessionStorage.setItem("showOnlyUserSurveys", JSON.stringify(showOnlyUserSurveys));
    }, [showOnlyUserSurveys]);

    useEffect(() => {
        // Actualizar el estado de las encuestas según las fechas
        if (store.surveys && store.surveys.length > 0) {
            const surveysToUpdate = store.surveys.map((survey) => {
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

                return newStatus !== survey.status ? { id: survey.id, newStatus } : null;
            }).filter(Boolean);

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

    const handleShowOnlyUserSurveysToggle = (e) => {
        const newValue = e.target.checked;
        setShowOnlyUserSurveys(newValue);
    };

    if (!store.surveys || store.surveys.length === 0) {
        return <div className="loading-container">
            <span className="available-surveys-loading">Loading...</span>
            <div className="spinner"></div>
        </div>;
    }

    // Filtrar las encuestas por el término de búsqueda
    let filteredSurveys = store.surveys.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrar las encuestas por estado
    if (filterStatus !== "all") {
        filteredSurveys = filteredSurveys.filter(survey => survey.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // Filtrar las encuestas creadas por el usuario logueado si está activado
    if (showOnlyUserSurveys && store.user) {
        filteredSurveys = filteredSurveys.filter(survey => survey.creator_id === store.user.id);
    }

    // Ordenar las encuestas activas por fecha de inicio en orden ascendente
    filteredSurveys.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Configuración de la paginación
    const indexOfLastSurvey = currentPage * surveysPerPage;
    const indexOfFirstSurvey = indexOfLastSurvey - surveysPerPage;
    const currentSurveys = filteredSurveys.slice(indexOfFirstSurvey, indexOfLastSurvey);
    const totalPages = Math.ceil(filteredSurveys.length / surveysPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Función que trunca el texto a 70 caracteres
    const truncateText = (text, maxLength) => {
        if (text.length > maxLength) {
            return text.slice(0, maxLength) + "..."; // Agrega "..." si se trunca
        }
        return text;
    };

    return (
        <div className="available-surveys-container">
            <h1 className="available-surveys-title text-center">Explore all surveys</h1>

            {/* Campo de búsqueda */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search here..."
                    className="search-drop"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoMdSearch className="search-icon" />
            </div>

            {/* Filtros de estado en forma de dropdown */}
            <div className="filter-section">
                <div className="dropdown">
                    <button className="dropdown-toggle filter-drop" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                        {filterStatus === "all" ? "Filter: All" : `Filter: ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}`}
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        <li><button className="dropdown-item" type="button" onClick={() => setFilterStatus("all")}>All</button></li>
                        <li><button className="dropdown-item" type="button" onClick={() => setFilterStatus("active")}>Active</button></li>
                        <li><button className="dropdown-item" type="button" onClick={() => setFilterStatus("closed")}>Closed</button></li>
                        <li><button className="dropdown-item" type="button" onClick={() => setFilterStatus("draft")}>Pending</button></li>
                    </ul>
                </div>
                <div className="user-survey-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={showOnlyUserSurveys}
                            onChange={handleShowOnlyUserSurveysToggle}
                        />
                        Show only my surveys
                    </label>
                </div>
            </div>

            <div className="available-surveys-list">
                {currentSurveys.map((survey) => (
                    <div key={survey.id} className="available-survey-card" onClick={() => handleSurveyClick(survey.id)}>
                        <div className="available-survey-card-header">
                            <img src={`https://loremflickr.com/600/400?random=${survey.id}`} alt="Survey" className="available-survey-image" />
                            <div className={`available-survey-status-header ${survey.is_public ? 'public' : 'private'}`}>
                                {survey.is_public ? 'Public' : 'Private'}
                            </div>
                        </div>
                        <div className="available-survey-card-body">
                            <div className="available-survey-card-body">
                                <div className="card-title-container">
                                    <h3 className="available-survey-card-title">{survey.title}</h3>
                                    <span className={`available-status-badge-title ${survey.status.toLowerCase()}`}>
                                        {survey.status === "draft" ? "Pending" : survey.status}
                                    </span>
                                </div>
                                <p className="available-survey-card-description">
                                    {truncateText(survey.description, 90)}
                                </p>
                                <div className="available-survey-card-footer">
                                    <p className="available-survey-card-dates">
                                        Available until: {new Date(survey.end_date).toLocaleDateString()}
                                    </p>
                                    {survey.status === "draft" && (
                                        <div className="available-survey-countdown">
                                            <span className="countdown-timer">⏳ Time left: {moment(survey.start_date).fromNow()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Paginador */}
            <div className="pagination-container">
                {[...Array(totalPages).keys()].map((number) => (
                    <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`pagination-button ${currentPage === number + 1 ? "active" : ""}`}
                    >
                        {number + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};