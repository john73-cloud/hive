"use client";

import { type PropsWithChildren } from "react";

import { AuthProvider } from "@/components/auth/context/auth-context";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function RootProviders({ children }: PropsWithChildren) {
    return (
        <QueryProvider>
            <AuthProvider>
                <ThemeProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
