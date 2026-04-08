"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { requestApi } from "@/hooks/use-fetch";

import type { SignupFormValues, SignupResponse } from "../types";

const signup = async (values: SignupFormValues) => {
    const payload = {
        email: values.email.trim(),
        password: values.password,
        name: values.name.trim(),
    };

    const response = await requestApi<SignupResponse>({
        url: "/auth/signup",
        method: "POST",
        body: payload,
        auth: "omit",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Signup failed.");
    }

    return response.data as SignupResponse;
};

export function useSignup() {
    const router = useRouter();

    return useMutation<SignupResponse, Error, SignupFormValues>({
        mutationFn: signup,
        onSuccess: () => {
            toast.success("Account created successfully. Redirecting to sign in...");
            router.replace("/login");
        },
        onError: (error) => {
            toast.error(error.message || "Unable to create account.");
        },
    });
}
