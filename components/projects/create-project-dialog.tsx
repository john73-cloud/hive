"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { useCreateBrandProject } from "@/components/brands/hooks";
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
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateProjectDialogProps = {
    brandId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (project: BrandProject) => void;
};

type CreateProjectFormValues = {
    name: string;
    data: unknown;
};

export function CreateProjectDialog({ brandId, open, onOpenChange, onCreated }: CreateProjectDialogProps) {
    const createProject = useCreateBrandProject();
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateProjectFormValues>({
        defaultValues: {
            name: "",
            data: null,
        },
    });

    const onSubmit = async (values: CreateProjectFormValues) => {
        const createdProject = await createProject.mutateAsync({
            brandId,
            values: {
                name: values.name,
                data: values.data as BrandProject["data"],
            },
        });
        reset();
        onOpenChange(false);
        onCreated(createdProject);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);
                if (!nextOpen) {
                    reset();
                }
            }}
        >
            <DialogContent className="border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">Create project</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Start with an empty canvas and move straight into the editor.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Field>
                        <FieldLabel>
                            <Label htmlFor="project-name">Project name</Label>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="project-name"
                                autoFocus
                                placeholder="Spring launch visual"
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
                            disabled={createProject.isPending}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            {createProject.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Creating
                                </>
                            ) : (
                                "Create and open"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
