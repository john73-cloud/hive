"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Plus, RefreshCcw } from "lucide-react";

import { useBrandsContext } from "@/components/brands/components/context";
import { useListBrandProjects } from "@/components/brands/hooks";
import type { BrandProject } from "@/components/brands/types";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const buildEditPath = (pathname: string, projectId: number) => {
    const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
    const basePath = normalizedPath === "/" ? "" : normalizedPath;
    return `${basePath}/edit/${projectId}`;
};

const formatCountLabel = (count: number) => {
    if (count === 1) {
        return "1 project";
    }

    return `${count} projects`;
};

type GraphicsWorkspaceProps = {
    brandId: number;
    brandName: string;
};

function GraphicsWorkspace({ brandId, brandName }: GraphicsWorkspaceProps) {
    const router = useRouter();
    const pathname = usePathname();

    const { data: projects, isPending, isError, refetch, error } = useListBrandProjects(brandId);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<BrandProject | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<BrandProject | null>(null);

    const sortedProjects = useMemo(
        () =>
            [...(projects ?? [])].sort(
                (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
            ),
        [projects]
    );

    const navigateToEditor = (projectId: number) => {
        router.push(buildEditPath(pathname, projectId));
    };

    return (
        <main className="min-h-svh bg-workspace-canvas text-zinc-100">
            <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Graphics workspace</p>
                        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-zinc-100 sm:text-4xl">
                            {brandName}
                        </h1>

                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className="border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                        >
                            <RefreshCcw />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            <Plus />
                            New project
                        </Button>
                    </div>
                </header>



                {isPending ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="overflow-hidden rounded-xl border border-white/10 bg-white/3 p-4"
                            >
                                <Skeleton className="h-4 w-28 bg-white/10" />
                                <Skeleton className="mt-3 h-3 w-24 bg-white/10" />
                                <Skeleton className="mt-6 h-16 w-full bg-white/10" />
                                <div className="mt-5 flex justify-between">
                                    <Skeleton className="h-3 w-14 bg-white/10" />
                                    <Skeleton className="h-7 w-16 bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {isError ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-5">
                        <p className="text-sm text-red-300">{error?.message ?? "Unable to load projects."}</p>
                        <Button
                            variant="outline"
                            className="mt-3 border-red-400/30 bg-transparent text-red-100 hover:bg-red-500/10"
                            onClick={() => refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : null}



                {!isPending && !isError && sortedProjects.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {sortedProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onOpen={(currentProject) => navigateToEditor(currentProject.id)}
                                onEdit={(currentProject) => setProjectToEdit(currentProject)}
                                onDelete={(currentProject) => setProjectToDelete(currentProject)}
                            />
                        ))}
                    </div>
                ) : null}


            </section>

            <CreateProjectDialog
                brandId={brandId}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreated={(createdProject) => navigateToEditor(createdProject.id)}
            />
            <EditProjectDialog
                brandId={brandId}
                project={projectToEdit}
                open={Boolean(projectToEdit)}
                onOpenChange={(open) => {
                    if (!open) {
                        setProjectToEdit(null);
                    }
                }}
            />
            <DeleteProjectDialog
                brandId={brandId}
                project={projectToDelete}
                open={Boolean(projectToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setProjectToDelete(null);
                    }
                }}
            />
        </main>
    );
}

export default function GraphicsPage() {
    const { selectedBrandId, selectedBrand, isLoadingBrands } = useBrandsContext();

    if (isLoadingBrands && !selectedBrandId) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-workspace-canvas text-zinc-300">
                Loading brands...
            </div>
        );
    }

    if (!selectedBrandId) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-workspace-canvas text-zinc-300">
                No brand is available for this workspace.
            </div>
        );
    }

    return <GraphicsWorkspace brandId={selectedBrandId} brandName={selectedBrand?.name ?? "Graphics"} />;
}
