"use client";

import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import type { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";

type AuthContextValue = {
    status: "loading" | "authenticated" | "unauthenticated";
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    user: Session["user"] | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthStateProvider({ children }: PropsWithChildren) {
    const { data: session, status } = useSession();

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            isAuthenticated: status === "authenticated",
            isLoading: status === "loading",
            session: session ?? null,
            user: session?.user ?? null,
        }),
        [session, status]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: PropsWithChildren) {
    return (
        <SessionProvider>
            <AuthStateProvider>{children}</AuthStateProvider>
        </SessionProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
