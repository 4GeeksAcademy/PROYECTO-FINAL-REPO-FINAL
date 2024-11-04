import React from "react";
import { Link } from "react-router-dom";
import logo from "../../img/logo.png";
import { VscGraph } from "react-icons/vsc";

export const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg" style={{ height: "80px",backgroundColor: "rgb(27, 27, 27)"}}>
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand text-light d-flex align-items-center" to="#" style={{ fontWeight: 'bold'}}>
        <VscGraph style={{ fontSize: "50px", color: '#8A4FFF'}} />
          <span style={{ color: '#8A4FFF' }}>E-</span>Vote
        </Link>

        {/* Search form */}
        <form className="d-flex ms-auto" style={{ width: '50%' }}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Buscar encuestas..."
            aria-label="Search"
            style={{ backgroundColor: '#1E2132', color: '#FFFFFF', borderColor: '#1E2132' }}
          />
        </form>

        {/* Right elements */}
        <ul className="navbar-nav ms-auto flex-row align-items-center">
        <li className="nav-item">
            <Link className="nav-link text-light d-flex align-items-center" to="#">
              <i className="fas fa-user fa-lg me-1" ></i>
            </Link>
          </li>
          <li className="nav-item me-3">
            <Link className="nav-link text-light" to="#">
              <i className="fas fa-bell fa-lg"></i>
            </Link>
          </li>
          <li className="nav-item me-3">
            <Link className="nav-link text-light" to="#">
              <i className="fas fa-cog fa-lg" style={{ color: '#8A4FFF' }}></i>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};