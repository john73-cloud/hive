"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { useUpdateProject } from "@/components/projects/hooks";
import type { Project } from "@/components/projects/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditProjectDialogProps = {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type EditProjectValues = {
    name: string;
};

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const updateProject = useUpdateProject();
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm<EditProjectValues>({
        defaultValues: {
            name: project?.name ?? "",
        },
    });

    useEffect(() => {
        reset({ name: project?.name ?? "" });
    }, [project?.name, reset]);

    const onSubmit = async (values: EditProjectValues) => {
        if (!project) {
            return;
        }

        await updateProject.mutateAsync({
            projectId: project.id,
            values: {
                name: values.name,
            },
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">Rename project</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Keep naming precise so collaborators can scan quickly.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Field>
                        <FieldLabel>
                            <Label htmlFor="rename-project-name">Project name</Label>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="rename-project-name"
                                autoFocus
                                placeholder="Campaign teaser"
                                className="border-white/15 bg-white/5 text-zinc-100"
                                {...register("name", {
                                    required: "Project name is required.",
                                    minLength: {
                                        value: 2,
                                        message: "Use at least 2 characters.",
                                    },
                                })}
                            />
                            <FieldError errors={[errors.name]} />
                        </FieldContent>
                    </Field>

                    <DialogFooter className="border-white/10 bg-zinc-950/80 sm:justify-between">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateProject.isPending || !project}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            {updateProject.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Saving
                                </>
                            ) : (
                                "Save name"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
