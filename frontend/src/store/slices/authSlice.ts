import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 1. Define the shape of your User state based on your JWT payload
interface User {
    user_id: number;
    email: string;
    role: 'USER' | 'ADMIN' | 'SELLER';
    full_name: string;
}

// 2. Define the auth state interface
interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
}

// 3. Check LocalStorage for existing session (Persist login across refreshes)
const storedToken = localStorage.getItem('accessToken');
const storedUser = localStorage.getItem('user');
const initialState: AuthState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    accessToken: storedToken || null,
    isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Call this after a successful Login API response
        setCredentials: (
        state, 
        action: PayloadAction<{ user: User; accessToken: string}>
        ) => {
        const { user, accessToken} = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.isAuthenticated = true;
        
        // Save to local storage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        },
        
        // Call this when the user clicks "Logout" or token expires
        logOut: (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        
        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;