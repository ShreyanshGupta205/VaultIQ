import { create } from 'zustand';

interface User {
    id: String;
    email: String;
    name?: String;
}

interface AuthState {
    user: User | null;
    token: String | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: String) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: false,
    setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token as string);
        }
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
