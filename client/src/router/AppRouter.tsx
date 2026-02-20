import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RolePage from '../pages/RolePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import FacultyDashboardPage from '../pages/FacultyDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ProtectedRoute from '../components/shared/ProtectedRoute';

const AppRouter = () => (
    <BrowserRouter>
        <Routes>
            {/* Auth pages */}
            <Route path="/" element={<RolePage />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/signup/:role" element={<SignupPage />} />

            {/* Protected dashboards */}
            <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboardPage />
                </ProtectedRoute>
            } />
            <Route path="/faculty/dashboard" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyDashboardPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <AdminDashboardPage />
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);

export default AppRouter;
