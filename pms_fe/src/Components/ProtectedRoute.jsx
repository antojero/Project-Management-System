import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../userContext";

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(UserContext);
    const location = useLocation();

    // If no access token, redirect to Login
    // Pass the current location to redirect back after login (optional future enhancement)
    if (!user || !user.access) {
        return <Navigate to="/Login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
