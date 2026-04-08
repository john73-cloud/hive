"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { requestApi } from "@/hooks/use-fetch";

import type {
    CreateOrganizationFormValues,
    CreateOrganizationResponse,
    UserOrganizationResponse,
} from "../types";

export const fetchUserOrganization = async (userId: string) => {
    const response = await requestApi<UserOrganizationResponse>({
        url: `/auth/user/${userId}/organization`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch organization.");
    }

    return response.data as UserOrganizationResponse;
};

export const createOrganization = async (values: CreateOrganizationFormValues) => {
    const response = await requestApi<CreateOrganizationResponse>({
        url: "/auth/organization",
        method: "POST",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to create organization.");
    }

    return response.data as CreateOrganizationResponse;
};

export function useUserOrganization(userId?: string) {
    return useQuery({
        queryKey: ["auth", "organization", userId],
        enabled: Boolean(userId),
        queryFn: () => fetchUserOrganization(userId as string),
    });
}

export function useCreateOrganization() {
    return useMutation<
        CreateOrganizationResponse,
        Error,
        CreateOrganizationFormValues
    >({
        mutationFn: createOrganization,
    });
}
