"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { useBrandsContext } from "@/components/brands/components/context";
import { useGetBrandProject, useUpdateBrandProject } from "@/components/brands/hooks";
import type { BrandProject } from "@/components/brands/types";
import AdvancedEditor from "@/components/editor/editor";
import type { PersistedScenePayload } from "@/components/imgly/config/actions";
import type { Project } from "@/components/projects/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Page = () => {
    const { id = "" } = useParams<{ id?: string }>();
    const { selectedBrandId, isLoadingBrands } = useBrandsContext();

    const queryClient = useQueryClient();
    const updateProject = useUpdateBrandProject();

    const projectId = Number(id);
    const {
        data: project,
        isPending,
        isError,
        error,
    } = useGetBrandProject(selectedBrandId, projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">Invalid project id.</p>
            </div>
        );
    }

    if (isLoadingBrands && !selectedBrandId) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">Loading workspace...</p>
            </div>
        );
    }

    if (!selectedBrandId) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-black text-zinc-200">
                <p className="text-sm text-zinc-400">No brand selected for this workspace.</p>
            </div>
        );
    }

    const handleSaveProjectData = (payload: PersistedScenePayload) => {
        updateProject.mutate(
            {
                brandId: selectedBrandId,
                projectId,
                values: {
                    data: payload,
                },
            },
            {
                onError: (mutationError) => {
                    toast.error(mutationError.message ?? "An error occurred while saving.");
                },
                onSuccess: () => {
                    toast.success("Project saved.");
                },
            }
        );
    };

    const handleProjectApplied = useCallback(
        async (appliedProject: Project) => {
            queryClient.setQueryData(
                ["brands", selectedBrandId, "projects", appliedProject.id],
                appliedProject as BrandProject
            );
            await queryClient.invalidateQueries({ queryKey: ["brands", selectedBrandId, "projects"] });
        },
        [queryClient, selectedBrandId]
    );

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
                <p className="text-sm text-zinc-400">{error?.message ?? "Unable to load this project."}</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-svh bg-black">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex px-4 pt-4 sm:px-6 sm:pt-6">
                <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="pointer-events-auto border border-white/15 bg-black/60 text-zinc-100 backdrop-blur hover:bg-black/80"
                >
                    <Link href="/graphics">
                        <ArrowLeft />
                        Back
                    </Link>
                </Button>
            </div>

            <AdvancedEditor
                project={project}
                onSaveProjectData={handleSaveProjectData}
                onProjectApplied={handleProjectApplied}
            />
        </div>
    );
};

export default Page;
