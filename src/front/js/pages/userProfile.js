import React, { useState, useContext, useEffect } from "react";
import { Context } from "../store/appContext";
import "../../styles/userProfile.css";
import { useNavigate } from "react-router-dom";

export const UserProfile = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!store.isAuthenticated) {
            navigate("/login");
        } else if (store.user) {
            setFullName(store.user.full_name || "");
            setEmail(store.user.email || "");
        } else {
            actions.getUserProfile().then((user) => {
                if (user) {
                    setFullName(user.full_name || "");
                    setEmail(user.email || "");
                }
            });
        }
    }, [store.isAuthenticated, store.user, navigate, actions]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!store.user?.id) {
            alert("No se ha encontrado un ID de usuario válido.");
            return;
        }

        const updatedUser = {
            full_name: fullName,
            email: email,
        };

        const success = await actions.updateUserProfile(store.user?.id, updatedUser); // Pasar el ID correctamente
        if (success) {
            alert("Perfil actualizado correctamente.");
            setIsEditing(false);
        } else {
            alert("Hubo un error al actualizar el perfil. Por favor, inténtalo de nuevo.");
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword) {
            alert("Por favor ingresa una nueva contraseña.");
            return;
        }

        if (!store.user?.id) {
            alert("No se ha encontrado un ID de usuario válido.");
            return;
        }

        const success = await actions.updateUserPassword(store.user?.id, { password: newPassword });
        if (success) {
            alert("Contraseña actualizada correctamente.");
            setNewPassword("");
        } else {
            alert("Hubo un error al actualizar la contraseña. Por favor, inténtalo de nuevo.");
        }
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    return (
        <div className="user-profile-container">
            <div className="container mt-5 content-center">
                <div className="jumbotron text-center p-5 mb-4 header-section">
                    <h2 className="display-5 fw-bold">Editar Perfil</h2>
                </div>

                <div className="card shadow-sm border-0 user-details-card">
                    <div className="card-body">
                        <form onSubmit={handleProfileUpdate}>
                            <div className="mb-3">
                                <label className="form-label">Nombre completo</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    readOnly={!isEditing}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Correo electrónico</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    readOnly={!isEditing}
                                    required
                                />
                            </div>
                            <div className="d-flex justify-content-between mb-4">
                                <button type="button" className="btn edit-btn" onClick={toggleEdit}>
                                    {isEditing ? "Cancelar" : "Editar Perfil"}
                                </button>
                                {isEditing && (
                                    <button type="submit" className="btn btn-primary update-account-btn">
                                        Guardar Cambios
                                    </button>
                                )}
                            </div>
                        </form>
                        <div className="mb-3">
                            <label className="form-label">Nueva contraseña</label>
                            <div className="d-flex">
                                <input
                                    type="password"
                                    className="form-control me-2"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nueva contraseña"
                                />
                                
                            </div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    className="btn password-btn"
                                    onClick={handlePasswordChange}
                                >
                                    Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;