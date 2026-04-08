"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type PropsWithChildren } from "react";

import { useAuth } from "@/components/auth/context/auth-context";
import { useSubdomain } from "@/components/domain/domain-context";

const getCurrentPath = (pathname: string, searchParams: { toString: () => string }) => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
};

const replaceSubdomainSegment = (pathname: string, userDomain: string) => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
        return `/${userDomain}`;
    }

    segments[0] = userDomain;
    return `/${segments.join("/")}`;
};

export function SubdomainAuthGuard({ children }: PropsWithChildren) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const subdomain = useSubdomain();
    const { isAuthenticated, isLoading, user } = useAuth();

    const state = useMemo(() => {
        if (isLoading) {
            return "loading" as const;
        }

        if (!isAuthenticated) {
            return "redirect-login" as const;
        }

        const userDomain = user?.domain?.toLowerCase();

        if (!userDomain) {
            return "redirect-organization" as const;
        }

        if (subdomain && subdomain.toLowerCase() !== userDomain) {
            return "redirect-domain" as const;
        }

        return "allow" as const;
    }, [isAuthenticated, isLoading, subdomain, user?.domain]);

    useEffect(() => {
        if (state === "loading" || state === "allow") {
            return;
        }

        if (state === "redirect-login") {
            const nextPath = getCurrentPath(pathname, searchParams);
            router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
            return;
        }

        if (state === "redirect-organization") {
            router.replace("/organization");
            return;
        }

        const normalizedDomain = user?.domain?.toLowerCase();

        if (normalizedDomain) {
            const targetPath = replaceSubdomainSegment(pathname, normalizedDomain);
            const query = searchParams.toString();
            const redirectUrl = query ? `${targetPath}?${query}` : targetPath;
            router.replace(redirectUrl);
        }
    }, [pathname, router, searchParams, state, user?.domain]);

    if (state !== "allow") {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <p className="text-sm text-muted-foreground">Checking workspace access...</p>
            </div>
        );
    }

    return <>{children}</>;
}
