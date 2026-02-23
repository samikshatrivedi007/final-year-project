import React, { createContext, useContext, useReducer } from 'react';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    selectedRole: string | null;
}

type AuthAction =
    | { type: 'SET_ROLE'; payload: string }
    | { type: 'LOGIN'; payload: { user: User; token: string } }
    | { type: 'LOGOUT' };

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('scms_user') || 'null'),
    token: localStorage.getItem('scms_token'),
    isAuthenticated: !!localStorage.getItem('scms_token'),
    selectedRole: localStorage.getItem('scms_role'),
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'SET_ROLE':
            localStorage.setItem('scms_role', action.payload);
            return { ...state, selectedRole: action.payload };
        case 'LOGIN':
            localStorage.setItem('scms_token', action.payload.token);
            localStorage.setItem('scms_user', JSON.stringify(action.payload.user));
            localStorage.setItem('scms_role', action.payload.user.role);
            return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, selectedRole: action.payload.user.role };
        case 'LOGOUT':
            localStorage.removeItem('scms_token');
            localStorage.removeItem('scms_user');
            localStorage.removeItem('scms_role');
            return { user: null, token: null, isAuthenticated: false, selectedRole: null };
        default:
            return state;
    }
}

interface AuthContextType {
    state: AuthState;
    setRole: (role: string) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const setRole = (role: string) => dispatch({ type: 'SET_ROLE', payload: role });
    const login = (user: User, token: string) => dispatch({ type: 'LOGIN', payload: { user, token } });
    const logout = () => dispatch({ type: 'LOGOUT' });

    return (
        <AuthContext.Provider value={{ state, setRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
