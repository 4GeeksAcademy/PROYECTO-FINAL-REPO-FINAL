const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            surveys: [],
            survey: null,
            user: null,
            isAuthenticated: !!localStorage.getItem("jwt-token"),
            userVotedSurveys: null
        },
        actions: {
            // Función para obtener el perfil del usuario actual
            getUserProfile: async () => {
                const token = localStorage.getItem("jwt-token");
                if (!token) return;

                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/me`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorResponse = await response.json();
                        console.error("Detalles del error: ", errorResponse);
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorResponse.message}`);
                    }

                    const result = await response.json();
                    setStore({ user: result, isAuthenticated: true });
                } catch (error) {
                    console.error("Error fetching user profile: ", error);
                    setStore({ isAuthenticated: false, user: null });
                }
            },

            getSurveys: async () => {
                try {
                    const token = localStorage.getItem("jwt-token");
                    if (!token) {
                        throw new Error("No authentication token found");
                    }
            
                    const response = await fetch(`${process.env.BACKEND_URL}/api/surveys`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });
            
                    if (!response.ok) {
                        const errorResponse = await response.json();
                        console.error("Error details:", errorResponse);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
            
                    const result = await response.json();
                    setStore({ surveys: result });
                } catch (error) {
                    console.error("Error fetching surveys: ", error);
                }
            },
            

            getUserVotedSurveys: async (userId) => {
                const token = localStorage.getItem("jwt-token");
                if (!token) {
                    console.error("Token not found");
                    setStore({ userVotedSurveys: [] }); // Asegúrate de limpiar el estado si no hay token
                    return [];
                }
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/users/${userId}/votes/surveys`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
            
                    if (!response.ok) {
                        console.error("Error fetching user voted surveys:", response.statusText);
                        setStore({ userVotedSurveys: [] });
                        return [];
                    }
            
                    const data = await response.json();
                    setStore({ userVotedSurveys: data });
                    return data; // Devuelve los datos para usarlos en los componentes
                } catch (error) {
                    console.error("Error fetching user voted surveys:", error);
                    setStore({ userVotedSurveys: [] });
                    return [];
                }
            },
            
            
            



            getUserSurveys: async (userId) => {
                const token = localStorage.getItem("jwt-token");
                if (!token || !userId) {
                    console.error("Token or user ID not found");
                    return;
                }
            
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/users/${userId}/surveys`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });
            
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
            
                    const result = await response.json();
                    if (result.surveys) {
                        setStore({ surveys: result.surveys });
                    } else {
                        console.error("No surveys found for user.");
                    }
                } catch (error) {
                    console.error("Error fetching user surveys: ", error);
                }
            },
            

            getSurvey: async (id) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${id}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem("jwt-token")}`
                        }
                    });
            
                    // Agrega un log para ver la respuesta recibida antes de procesarla
                    console.log("Response received:", response);
            
                    if (!response.ok) {
                        console.error(`HTTP error! status: ${response.status}`);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
            
                    // Verifica que la respuesta sea JSON antes de convertirla
                    const contentType = response.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("Unexpected response format: expected JSON.");
                    }
            
                    const survey = await response.json();
                    setStore({ survey });
                } catch (error) {
                    console.error("Error fetching survey by ID:", error);
                    alert(`Error fetching survey details: ${error.message}`);
                }
            },
            
            login: async (data) => {
                localStorage.setItem("jwt-token", data.token);
                setStore({ isAuthenticated: true });
                await getActions().getUserProfile(); // Obtener el perfil completo del usuario después del login
            },


            logout: () => {
                localStorage.removeItem("jwt-token");
                localStorage.removeItem("user_id");
                setStore({
                    isAuthenticated: false,
                    user: null,
                    surveys: [],
                    survey: null,
                });
                window.location.href = "/"; // Redirige a la página principal después del logout
            },

            updateSurveyStatus: async (id, status) => {
                try {
                    const token = localStorage.getItem("jwt-token");
                    const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ status }),
                    });
            
                    if (!response.ok) {
                        console.error("Error updating survey status:", response.status);
                        return;
                    }
            
                    const updatedSurvey = await response.json();
            
                    // Actualizar el estado global
                    setStore({
                        surveys: getStore().surveys.map((survey) =>
                            survey.id === updatedSurvey.id ? updatedSurvey : survey
                        ),
                    });
            
                    console.log("Survey status updated:", updatedSurvey);
                } catch (error) {
                    console.error("Error in updateSurveyStatus:", error);
                }
            },
            
            

            // flux.js

            updateUserPassword: async (userId, data) => {
                const token = localStorage.getItem("jwt-token");
            
                if (!token) {
                    console.error("No se encontró un token de autenticación");
                    alert("Error: No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.");
                    return false;
                }
            
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/users/${userId}/update-password`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(data)
                    });
            
                    if (response.ok) {
                        return true;
                    } else {
                        const errorData = await response.json();
                        console.error("Error al realizar la solicitud:", errorData);
                        alert("Hubo un error al actualizar la contraseña. Por favor, inténtalo de nuevo.");
                        return false;
                    }
                } catch (error) {
                    console.error("Error al realizar la solicitud:", error);
                    return false;
                }
            },
            
            updateUserProfile: async (userId, updatedUser) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/api/users/${userId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem("jwt-token")}`,
                        },
                        body: JSON.stringify(updatedUser),
                    });
            
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
            
                    return true;
                } catch (error) {
                    console.error("Error en la solicitud de actualización del perfil:", error);
                    return false;
                }
            },
            
              
            
            // Función para verificar si el usuario está autenticado al cargar la aplicación
            checkAuth: async () => {
                const token = localStorage.getItem("jwt-token");
                if (token) {
                    await getActions().getUserProfile();
                }
            },

            updateSurveyStatus: async (surveyId, newStatus) => {
                try {
                    const token = localStorage.getItem("jwt-token");
                    if (!token) {
                        throw new Error("User not logged in");
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/api/surveys/${surveyId}/status`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Response error:", errorText);
                        throw new Error("Failed to update survey status");
                    }

                    // Actualiza el estado en el store con la nueva información de la encuesta
                    const updatedSurvey = await response.json();
                    setStore({
                        ...getStore(),
                        surveys: getStore().surveys.map(survey =>
                            survey.id === updatedSurvey.id ? { ...survey, status: newStatus } : survey
                        ),
                        survey: { ...getStore().survey, status: newStatus }
                    });
                } catch (error) {
                    console.error("Error updating survey status:", error);
                }
            },
        }
    };
};

export default getState;
