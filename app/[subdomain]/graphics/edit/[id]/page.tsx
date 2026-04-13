"use client";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandsContext } from "@/components/brands/components/context";
import { useGetBrandProject, useUpdateBrandProject } from "@/components/brands/hooks";
import type { BrandProject } from "@/components/brands/types";
import AdvancedEditor from "@/components/editor/editor";
import type { PersistedScenePayload } from "@/components/imgly/config/actions";
import type { Project } from "@/components/projects/types";
import { toast } from "sonner";

const Page = () => {
    const { id = "" } = useParams<{ id?: string }>();
    const router = useRouter();
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

    const handleSaveProjectData = async (payload: PersistedScenePayload) => {
        await updateProject.mutateAsync(
            {
                brandId: selectedBrandId,
                projectId,
                values: {
                    data: payload as unknown as BrandProject["data"],
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

    const handleProjectApplied = async (appliedProject: Project) => {
        const normalizedProject: BrandProject = {
            id: appliedProject.id,
            name: appliedProject.name,
            data: appliedProject.data as unknown as BrandProject["data"],
            history: (appliedProject.history ?? []) as unknown as BrandProject["history"],
            brandId: selectedBrandId,
            createdAt: appliedProject.createdAt,
            updatedAt: appliedProject.updatedAt,
        };

        queryClient.setQueryData(["brands", selectedBrandId, "projects", appliedProject.id], normalizedProject);
        await queryClient.invalidateQueries({ queryKey: ["brands", selectedBrandId, "projects"] });
    };

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
            <AdvancedEditor
                project={project}
                onSaveProjectData={handleSaveProjectData}
                onProjectApplied={handleProjectApplied}
                onNavigateBack={() => router.push("/graphics")}
            />
        </div>
    );
};

export default Page;
