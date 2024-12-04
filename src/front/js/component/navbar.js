// Navbar.js
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import { VscGraph } from "react-icons/vsc";
import "../../styles/navbar.css";

export const Navbar = () => {
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.logout();
    navigate("/"); // Redirige a la pantalla de inicio sin loguear
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid">
        {/* Brand */}
        <Link
          className="navbar-brand d-flex align-items-center"
          to={store.isAuthenticated ? "/user_logued" : "/"}
        >
          <VscGraph className="navbar-icon" />
          <span className="Etitle navbar-title-highlight">Survey-</span>
          <span className="text-white Vtitle">Hub</span>
        </Link>

        {/* Toggle button for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Right elements */}
          <ul className="navbar-nav ms-auto flex-row align-items-center">
            {/* Login Button */}
            {!store.isAuthenticated && (
              <li className="nav-item me-3">
                <Link to="/login" className="btn btn-login">
                  Login
                </Link>
              </li>
            )}

            {/* Authenticated Options */}
            {store.isAuthenticated && (
              <>
                <li className="nav-item me-3">
                  <Link className="nav-link" to="/user_logued">
                    <i className="fas fa-poll fa-lg"></i> My Surveys
                  </Link>
                </li>
                <li className="nav-item me-3">
                  <button className="btn btn-login nav-link" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
