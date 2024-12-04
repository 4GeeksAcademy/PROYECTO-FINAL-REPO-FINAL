import React, { useState, useContext, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";

import { Home } from "./pages/home";
// import { HomeUserLogued } from "./pages/home_user_logued";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import injectContext, { Context } from "./store/appContext";
import { Login } from "./pages/login";
import { UserProfile } from "./pages/userProfile";
import { CreateSurvey } from "./pages/createSurvey";
import { Register } from "./pages/register";
import { SurveyResults } from "./pages/surveyResults";
import { ForgotPassword } from "./pages/recoverPassword";
import { AvailableSurveys } from "./pages/surveys";
import UserDashboard from "./pages/dashBoard";

import { Navbar } from "./component/navbar";
import { Footer } from "./component/footer";

//create your first component
const Layout = () => {
    const basename = process.env.BASENAME || "";
    const { store } = useContext(Context);

    if (!process.env.BACKEND_URL || process.env.BACKEND_URL === "") return <BackendURL />;

    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar />
                    <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<Login />} path="/login" />
                        <Route element={<Register />} path="/register" />
                        <Route element={<AvailableSurveys />} path="/surveys" />
                        {/* <Route 
                            path="/user_logued" 
                            element={store.isAuthenticated ? <HomeUserLogued /> : <Navigate to="/login" />} 
                        /> */}
                        <Route 
                            path="/profile" 
                            element={store.isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} 
                        />
                        <Route 
                            path="/user_logued" 
                            element={store.isAuthenticated ? <UserDashboard /> : <Navigate to="/login" />} 
                        />
                                                {/* <Route 
                            path="/user_logued" 
                            element={store.isAuthenticated ? <HomeUserLogued /> : <Navigate to="/login" />} 
                        /> */}
                        <Route 
                            path="/create_survey" 
                            element={store.isAuthenticated ? <CreateSurvey /> : <Navigate to="/login" />} 
                        />
                        <Route element={<SurveyResults/>} path="/surveys/:id"/>
                        <Route element={<ForgotPassword/>} path="/forgot-password" />
                        <Route element={<Demo />} path="/demo" />
                        <Route element={<Single />} path="/single/:theid" />
                        <Route element={<h1>Not found!</h1>} />
                    </Routes>
                    <Footer />
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);
