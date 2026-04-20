"use client";

import { useMutation } from "@tanstack/react-query";
import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import type { LoginFormValues, LoginResult } from "../types";

export const getHostSubdomain = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const hostname = window.location.hostname.toLowerCase();

    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
        return null;
    }

    if (hostname.endsWith(".localhost")) {
        const labels = hostname.replace(/\.localhost$/, "").split(".").filter(Boolean);
        const candidate = labels[0];
        return candidate && candidate !== "www" ? candidate : null;
    }

    const labels = hostname.split(".").filter(Boolean);

    if (labels.length < 3) {
        return null;
    }

    const candidate = labels[0] === "www" ? labels[1] : labels[0];
    return candidate || null;
};

const login = async ({
    values,
    nextPath,
}: {
    values: LoginFormValues;
    nextPath: string | null;
}): Promise<LoginResult> => {
    const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
    });

    if (!signInResult || signInResult.error) {
        throw new Error("Invalid email or password.");
    }

    const session = await getSession();
    const userDomain = session?.user?.domain?.toLowerCase();
    if (!userDomain) {
        return { redirectPath: "/organization", domain: null };
    }

    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        return { redirectPath: nextPath, domain: userDomain };
    }

    return { redirectPath: "/", domain: userDomain };
};

export function useLogin() {
    const searchParams = useSearchParams();
    return useMutation<LoginResult, Error, LoginFormValues>({
        mutationFn: (values) => login({ values, nextPath: searchParams.get("next") }),
    });
}
