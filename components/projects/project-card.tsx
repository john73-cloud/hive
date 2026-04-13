"use client";

import { ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
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
import type { BrandProject } from "@/components/brands/types";

type ProjectCardProps = {
    project: BrandProject;
    onOpen: (project: BrandProject) => void;
    onEdit: (project: BrandProject) => void;
    onDelete: (project: BrandProject) => void;
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
        <Card className="relative border border-white/10 bg-zinc-900/80 text-zinc-100 ring-0">
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
