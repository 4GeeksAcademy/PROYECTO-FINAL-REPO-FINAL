// appContext.js
import React, { useState, useEffect, useRef } from "react";
import getState from "./flux.js";

export const Context = React.createContext(null);

const injectContext = (PassedComponent) => {
  const StoreWrapper = (props) => {
    const [state, setState] = useState(
      getState({
        getStore: () => state.store,
        getActions: () => state.actions,
        setStore: (updatedStore) =>
          setState({
            store: Object.assign(state.store, updatedStore),
            actions: { ...state.actions },
          }),
      })
    );

    // Ref to track timeout for inactivity
    const logoutTimerRef = useRef(null);

    // Function to reset the inactivity timer
    const resetInactivityTimeout = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      logoutTimerRef.current = setTimeout(() => {
        state.actions.logout();
      }, 30 * 60 * 1000); // Logout after 30 minutes of inactivity
    };

    useEffect(() => {
      // Set up event listeners for user activity
      window.addEventListener("mousemove", resetInactivityTimeout);
      window.addEventListener("keydown", resetInactivityTimeout);
      window.addEventListener("click", resetInactivityTimeout);

      // Initialize inactivity timeout when the component mounts
      resetInactivityTimeout();

      return () => {
        // Clean up event listeners and timeout on unmount
        window.removeEventListener("mousemove", resetInactivityTimeout);
        window.removeEventListener("keydown", resetInactivityTimeout);
        window.removeEventListener("click", resetInactivityTimeout);
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
      };
    }, [state.actions]);

    return (
      <Context.Provider value={state}>
        <PassedComponent {...props} />
      </Context.Provider>
    );
  };

  return StoreWrapper;
};

export default injectContext;
