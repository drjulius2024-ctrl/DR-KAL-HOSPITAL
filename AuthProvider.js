"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/auth_constants';

import { SecureStorage } from '@/lib/secure_storage';

const AuthContext = createContext();

function AuthStateAdapter({ children }) {
    const { data: session, status } = useSession(); // status: "loading" | "authenticated" | "unauthenticated"
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // 1. Try to recover from SecureStorage first (fastest)
        const storedUser = SecureStorage.getItem('dr_kal_user');

        if (session?.user) {
            // 2. Session is authoritative if present
            console.log("Auth Sync: Updating User from Session");
            setUser(session.user);
            SecureStorage.setItem('dr_kal_user', session.user);
        } else if (storedUser) {
            // 3. Fallback to stored user if session is loading or not ready
            console.log("Auth Sync: Restoring User from Storage");
            setUser(storedUser);
        } else if (status === 'unauthenticated') {
            // 4. Clearly logged out
            setUser(null);
            SecureStorage.removeItem('dr_kal_user');
        }
    }, [session, status]);

    const login = async (email, password) => {
        try {
            console.log("Attempting login via NextAuth...");
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password
            });

            console.log("NextAuth Result:", result);

            if (result?.error) {
                console.error("Login Error:", result.error);
                return { success: false, error: 'Invalid credentials. Please check your email/password.' };
            }

            if (result?.ok) {
                console.log("Login Successful, redirecting to /dashboard");
                router.push('/dashboard');
                router.refresh(); // Ensure strict refresh of session state
                return { success: true };
            }

            return { success: false, error: 'Unexpected login state' };
        } catch (error) {
            console.error("Login fatal error", error);
            return { success: false, error: 'Login failed due to system error.' };
        }
    };

    const register = async (data) => {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.error || 'Registration failed' };
            }

            if (result.success) {
                // If Verified (Patient), Auto-Login
                if (data.role === ROLES.PATIENT || data.role === ROLES.ADMIN) {
                    await login(data.email, data.password);
                    alert(`✅ Registration Successful!\n\nWelcome email and SMS confirmation sent to ${data.email} and your phone number.`);
                } else {
                    alert(`⏳ Registration Submitted!\n\nA verification request has been sent to ${data.email}.\nYou will be notified once an administrator approves your account.`);
                    router.push('/login');
                }
                return { success: true };
            }
        } catch (error) {
            console.error("Registration error", error);
            return { success: false, error: 'Registration failed.' };
        }
    };

    const logout = async () => {
        SecureStorage.removeItem('dr_kal_user');
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isLoading: status === "loading" }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }) {
    return (
        <SessionProvider>
            <AuthStateAdapter>
                {children}
            </AuthStateAdapter>
        </SessionProvider>
    );
}

export const useAuth = () => useContext(AuthContext);

// Backwards compatibility for AdminDashboard usage (stubbed)
// --- Admin Actions ---
export const updateUserStatus = async (email, status) => {
    try {
        const res = await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, status })
        });
        const data = await res.json();
        return data.success;
    } catch (error) {
        console.error("Failed to update user status:", error);
        return false;
    }
};
