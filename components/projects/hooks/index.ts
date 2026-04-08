"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { requestApi } from "@/hooks/use-fetch";
import type {
    CreateProjectFormValues,
    DeleteProjectResponse,
    Project,
    UpdateProjectFormValues,
    UpdateProjectPayload,
} from "../types";

const projectKeys = {
    all: ["projects"] as const,
    list: () => [...projectKeys.all, "list"] as const,
    detail: (projectId: number) => [...projectKeys.all, "detail", projectId] as const,
};

const getProjectDataDebugSummary = (data: UpdateProjectFormValues["data"]) => {
    if (data === null) {
        return { dataType: "null" };
    }

    if (Array.isArray(data)) {
        return { dataType: "array", itemCount: data.length };
    }

    if (typeof data === "object") {
        const record = data as Record<string, unknown>;
        const scene = record.scene;

        return {
            dataType: "object",
            keys: Object.keys(record).length,
            ...(typeof scene === "string" ? { sceneLength: scene.length } : {}),
        };
    }

    return { dataType: typeof data };
};

const createProject = async (values: CreateProjectFormValues) => {
    const payload: CreateProjectFormValues = {
        name: values.name.trim(),
        data: values.data ?? null,
    };

    const response = await requestApi<Project>({
        url: "/projects",
        method: "POST",
        body: payload,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to create project.");
    }

    return response.data as Project;
};

const listProjects = async () => {
    const response = await requestApi<Project[]>({
        url: "/projects",
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch projects.");
    }

    return response.data as Project[];
};

const getProjectById = async (projectId: number) => {
    const response = await requestApi<Project>({
        url: `/projects/${projectId}`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch project.");
    }

    return response.data as Project;
};

const updateProject = async ({ projectId, values }: UpdateProjectPayload) => {
    const startedAt = Date.now();
    const payload: UpdateProjectFormValues = {};

    console.info("[ProjectsHooks] updateProject started", {
        projectId,
        hasName: typeof values.name === "string",
        hasData: "data" in values,
    });

    if (typeof values.name === "string") {
        payload.name = values.name.trim();
    }

    if ("data" in values) {
        payload.data = values.data ?? null;
        console.info("[ProjectsHooks] updateProject payload data summary", {
            projectId,
            ...getProjectDataDebugSummary(payload.data),
        });
    }

    const response = await requestApi<Project>({
        url: `/projects/${projectId}`,
        method: "PUT",
        body: payload,
        auth: "required",
    });

    if (!response.success) {
        console.error("[ProjectsHooks] updateProject failed", {
            projectId,
            durationMs: Date.now() - startedAt,
            error: response.error,
        });
        throw new Error(response.error ?? "Unable to update project.");
    }

    console.info("[ProjectsHooks] updateProject succeeded", {
        projectId,
        durationMs: Date.now() - startedAt,
    });

    return response.data as Project;
};

const deleteProject = async (projectId: number) => {
    const response = await requestApi<DeleteProjectResponse>({
        url: `/projects/${projectId}`,
        method: "DELETE",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to delete project.");
    }

    return response.data as DeleteProjectResponse;
};

export function useListProjects() {
    return useQuery({
        queryKey: projectKeys.list(),
        queryFn: listProjects,
    });
}

export function useGetProject(projectId?: number | null) {
    return useQuery({
        queryKey: projectKeys.detail(projectId as number),
        enabled: typeof projectId === "number" && Number.isFinite(projectId),
        queryFn: () => getProjectById(projectId as number),
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation<Project, Error, CreateProjectFormValues>({
        mutationFn: createProject,
        onSuccess: (createdProject) => {
            queryClient.setQueryData(projectKeys.detail(createdProject.id), createdProject);
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            toast.success("Project created successfully.");
        },
        onError: (error) => {
            toast.error(error.message || "Unable to create project.");
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation<Project, Error, UpdateProjectPayload>({
        mutationFn: updateProject,
        onSuccess: (updatedProject) => {
            queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            toast.success("Project updated successfully.");
        },
        onError: (error) => {
            toast.error(error.message || "Unable to update project.");
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation<DeleteProjectResponse, Error, number>({
        mutationFn: deleteProject,
        onSuccess: (result, projectId) => {
            queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
            queryClient.setQueryData(projectKeys.list(), (current: Project[] | undefined) =>
                current ? current.filter((project) => project.id !== projectId) : current,
            );
            toast.success(result.message || "Project deleted.");
        },
        onError: (error) => {
            toast.error(error.message || "Unable to delete project.");
        },
    });
}
