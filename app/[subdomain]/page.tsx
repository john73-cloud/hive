"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Plus, RefreshCcw } from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { useListProjects } from "@/components/projects/hooks";
import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/components/projects/types";
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

const Page = () => {
    const router = useRouter();
    const pathname = usePathname();

    const { data: projects, isPending, isError, refetch, error } = useListProjects();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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
        <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(180deg,#090b10_0%,#05060a_100%)] text-zinc-100">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(50rem_30rem_at_10%_-10%,rgba(148,163,184,0.24),transparent)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(45rem_24rem_at_100%_0%,rgba(255,255,255,0.12),transparent)]" />

            <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Workspace</p>
                        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-zinc-100 sm:text-4xl">
                            Your projects
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                            Keep production files organized, iterate quickly, and reopen every design exactly where
                            you left it.
                        </p>
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

                <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <span>{formatCountLabel(sortedProjects.length)}</span>
                    <span>Sorted by latest update</span>
                </div>

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

                {!isPending && !isError && sortedProjects.length === 0 ? (
                    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/3 p-8 md:grid-cols-[1.4fr_1fr] md:items-end">
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">No projects yet</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
                                Create your first canvas
                            </h2>
                            <p className="mt-2 max-w-lg text-sm text-zinc-400">
                                Start with a name, jump into the editor, and each save will persist scene JSON directly
                                to your backend project record.
                            </p>
                        </div>
                        <div className="flex md:justify-end">
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                            >
                                <Plus />
                                Create project
                            </Button>
                        </div>
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

                {!isPending && !isError && sortedProjects.length > 0 ? (
                    <footer className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-zinc-500">
                        <span>Projects auto-refresh after every create, rename, and delete.</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                            onClick={() => {
                                const firstProjectId = sortedProjects[0]?.id;

                                if (firstProjectId) {
                                    navigateToEditor(firstProjectId);
                                }
                            }}
                        >
                            Continue latest
                            <ArrowUpRight />
                        </Button>
                    </footer>
                ) : null}
            </section>

            <CreateProjectDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreated={(createdProject) => navigateToEditor(createdProject.id)}
            />
            <EditProjectDialog
                project={projectToEdit}
                open={Boolean(projectToEdit)}
                onOpenChange={(open) => {
                    if (!open) {
                        setProjectToEdit(null);
                    }
                }}
            />
            <DeleteProjectDialog
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
};

export default Page;