"use client";

import { ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/components/projects/types";

type ProjectCardProps = {
    project: Project;
    onOpen: (project: Project) => void;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
};

const getDataKind = (data: Project["data"]) => {
    if (data === null) {
        return "No scene data yet";
    }

    if (Array.isArray(data)) {
        return `Array (${data.length})`;
    }

    if (typeof data === "object") {
        return "JSON object";
    }

    return typeof data;
};

const formatProjectDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown update time";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

export function ProjectCard({ project, onOpen, onEdit, onDelete }: ProjectCardProps) {
    return (
        <Card className="relative border border-white/10 bg-[radial-gradient(140%_100%_at_100%_0%,rgba(255,255,255,0.10),transparent_70%),linear-gradient(180deg,rgba(15,18,24,0.88),rgba(10,12,18,0.95))] text-zinc-100 ring-0">
            <CardHeader>
                <CardTitle className="line-clamp-1 text-base tracking-tight text-zinc-100">
                    {project.name}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                    Updated {formatProjectDate(project.updatedAt)}
                </CardDescription>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                aria-label={`Open actions for ${project.name}`}
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-300 hover:bg-white/10 hover:text-white"
                            >
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onOpen(project)}>
                                <ArrowUpRight />
                                Open editor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(project)}>
                                <Pencil />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
                                <Trash2 />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Scene payload</p>
                    <p className="mt-1 text-sm text-zinc-300">{getDataKind(project.data)}</p>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-white/10 bg-black/25">
                <p className="text-xs text-zinc-500">Project #{project.id}</p>
                <Button
                    size="sm"
                    className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    onClick={() => onOpen(project)}
                >
                    Open
                </Button>
            </CardFooter>
        </Card>
    );
}
