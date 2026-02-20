import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { state } = useAuth();
    if (!state.isAuthenticated) return <Navigate to="/" replace />;
    if (allowedRoles && state.user && !allowedRoles.includes(state.user.role)) {
        // Redirect to correct dashboard based on actual role
        const redirects: Record<string, string> = { student: '/student/dashboard', faculty: '/faculty/dashboard', admin: '/admin/dashboard', superadmin: '/admin/dashboard' };
        return <Navigate to={redirects[state.user.role] || '/'} replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;
