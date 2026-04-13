"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { requestApi } from "@/hooks/use-fetch";
import type {
    ApplySceneEditRequest,
    Project,
    ProjectSceneData,
    ProjectSceneHistoryEntry,
    PreviewSceneEditRequest,
} from "@/components/projects/types";

type PreviewSceneEditPayload = {
    brandId: number;
    projectId: number;
    instruction: string;
};

type ApplySceneEditPayload = {
    brandId: number;
    projectId: number;
    instruction: string;
    data: ProjectSceneData;
};

type SceneProjectLike = {
    data?: unknown;
    history?: unknown;
};

export const getProjectSceneData = (project: SceneProjectLike | undefined): ProjectSceneData | null => {
    if (!project) {
        return null;
    }

    return (project.data as ProjectSceneData) ?? null;
};

export const getProjectSceneBase64 = (project: SceneProjectLike | undefined): string | null => {
    const sceneData = getProjectSceneData(project);

    if (!sceneData) {
        return null;
    }

    return JSON.stringify(sceneData);
};

export const getProjectSceneHistory = (project: SceneProjectLike | undefined): ProjectSceneHistoryEntry[] => {
    if (!project || !Array.isArray(project.history)) {
        return [];
    }

    return project.history as ProjectSceneHistoryEntry[];
};

export const previewProjectSceneEdit = async ({
    brandId,
    projectId,
    instruction,
}: PreviewSceneEditPayload): Promise<Project> => {
    const body: PreviewSceneEditRequest = {
        instruction: instruction.trim()
    };

    const response = await requestApi<Project>({
        url: `/brands/${brandId}/projects/${projectId}/scene/edit`,
        method: "POST",
        auth: "required",
        body,
    });

    if (!response.success) {
        if (response.status === 422) {
            throw new Error(
                response.error ??
                "Scene agent did not apply any changes. Try a more specific instruction."
            );
        }

        throw new Error(response.error ?? "Unable to preview scene edit.");
    }

    if (!response.data) {
        throw new Error("Preview response did not include a project payload.");
    }

    return response.data;
};

export function usePreviewSceneEdit(brandId: number, projectId: number) {
    return useMutation<Project, Error, { instruction: string }>({
        mutationFn: ({ instruction }) =>
            previewProjectSceneEdit({
                brandId,
                projectId,
                instruction,
            }),
        onError: (error) => {
            toast.error(error.message || "Unable to preview scene edit.");
        },
    });
}

export const applyProjectSceneEdit = async ({
    brandId,
    projectId,
    instruction,
    data,
}: ApplySceneEditPayload): Promise<Project> => {
    const body: ApplySceneEditRequest = {
        instruction: instruction.trim(),
        data,
    };

    const response = await requestApi<Project>({
        url: `/brands/${brandId}/projects/${projectId}/scene/apply`,
        method: "POST",
        auth: "required",
        body,
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to apply scene edit.");
    }

    if (!response.data) {
        throw new Error("Apply response did not include a project payload.");
    }

    return response.data;
};

export function useApplySceneEdit(brandId: number, projectId: number) {
    const queryClient = useQueryClient();

    return useMutation<Project, Error, { instruction: string; data: ProjectSceneData }>({
        mutationFn: ({ instruction, data }) =>
            applyProjectSceneEdit({
                brandId,
                projectId,
                instruction,
                data,
            }),
        onSuccess: (project) => {
            queryClient.setQueryData(["brands", brandId, "projects", project.id], project);
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast.success("AI edit applied successfully.");
        },
        onError: (error) => {
            toast.error(error.message || "Unable to apply scene edit.");
        },
    });
}
