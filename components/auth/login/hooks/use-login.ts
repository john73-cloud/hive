"use client";

import { useMutation } from "@tanstack/react-query";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { LoginFormValues, LoginResult } from "../types";

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
        return { redirectPath: "/organization" };
    }

    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        const firstSegment = nextPath
            .split("?")[0]
            .split("/")
            .filter(Boolean)[0]
            ?.toLowerCase();

        if (!firstSegment || firstSegment === userDomain) {
            return { redirectPath: nextPath };
        }
    }

    return { redirectPath: `/${userDomain}` };
};

export function useLogin() {
    const router = useRouter();
    const searchParams = useSearchParams();

    return useMutation<LoginResult, Error, LoginFormValues>({
        mutationFn: (values) => login({ values, nextPath: searchParams.get("next") }),
        onSuccess: ({ redirectPath }) => {
            toast.success("Login successful! Redirecting...");
            router.replace(redirectPath);
            router.refresh();
        },
        onError: (error) => {
            toast.error(error.message || "Unable to sign in.");
        },
    });
}
