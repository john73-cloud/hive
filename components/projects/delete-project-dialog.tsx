"use client";

import { Loader2, Trash2 } from "lucide-react";

import { useDeleteBrandProject } from "@/components/brands/hooks";
import type { BrandProject } from "@/components/brands/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type DeleteProjectDialogProps = {
    brandId: number;
    project: BrandProject | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DeleteProjectDialog({ brandId, project, open, onOpenChange }: DeleteProjectDialogProps) {
    const deleteProject = useDeleteBrandProject();

    const onDelete = async () => {
        if (!project) {
            return;
        }

        await deleteProject.mutateAsync({ brandId, projectId: project.id });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border border-red-500/20 bg-zinc-950 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">Delete project</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        This permanently removes <span className="font-medium text-zinc-200">{project?.name}</span> and
                        all stored scene data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="border-white/10 bg-zinc-950/80 sm:justify-between">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Keep project
                    </Button>
                    <Button type="button" variant="destructive" onClick={onDelete} disabled={deleteProject.isPending}>
                        {deleteProject.isPending ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Deleting
                            </>
                        ) : (
                            <>
                                <Trash2 />
                                Delete forever
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
