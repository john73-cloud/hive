"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";

import AdvancedEditor from "@/components/editor/editor";
import type { PersistedScenePayload } from "@/components/imgly/config/actions";
import { useGetProject, useUpdateProject } from "@/components/projects/hooks";

const Page = () => {
    const params = useParams<{ id?: string }>();
    const projectId = useMemo(() => {
        const rawId = params.id;

        if (!rawId) {
            return null;
        }

        const parsedId = Number(rawId);
        return Number.isFinite(parsedId) ? parsedId : null;
    }, [params.id]);

    const updateProject = useUpdateProject();
    const mutateProjectRef = useRef(updateProject.mutateAsync);

    useEffect(() => {
        mutateProjectRef.current = updateProject.mutateAsync;
    }, [updateProject.mutateAsync]);

    const {
        data: project,
        isPending,
        isError,
        error,
    } = useGetProject(projectId);

    const handleSaveProjectData = useCallback(
        async (payload: PersistedScenePayload) => {
            if (projectId === null) {
                throw new Error("Cannot save: project id is invalid.");
            }

            const resolvedProjectId = projectId;
            const startedAt = Date.now();
            console.info("[ProjectEdit] Persisting project payload", {
                projectId: resolvedProjectId,
                sceneLength: payload.scene.length,
                assetCount: payload.assets.length,
                transientAssetCount: payload.assets.filter((asset) => asset.transient).length,
                dataAssetCount: payload.assets.filter((asset) => asset.scheme === "data").length,
            });

            try {
                await mutateProjectRef.current({
                    projectId: resolvedProjectId,
                    values: {
                        data: payload,
                    },
                });

                console.info("[ProjectEdit] Project payload persisted", {
                    projectId: resolvedProjectId,
                    durationMs: Date.now() - startedAt,
                });
            } catch (error) {
                console.error("[ProjectEdit] Project payload persistence failed", {
                    projectId: resolvedProjectId,
                    durationMs: Date.now() - startedAt,
                    error,
                });
                throw error;
            }
        },
        [projectId]
    );

    if (projectId === null) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">Invalid project id.</p>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">Loading project scene...</p>
            </div>
        );
    }

    if (isError || !project) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">
                    {error?.message ?? "Unable to load this project."}
                </p>
            </div>
        );
    }

    return (
        <AdvancedEditor
            projectData={project.data}
            onSaveProjectData={handleSaveProjectData}
        />
    );
};

export default Page;