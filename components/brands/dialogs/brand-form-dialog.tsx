"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { useCreateBrand } from "@/components/brands/hooks";
import type { Brand } from "@/components/brands/types";
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

export type BrandFormDialogMode = "create";

type BrandFormDialogProps = {
    mode: BrandFormDialogMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (brand: Brand) => void;
};

type BrandCreateFormValues = {
    name: string;
    primaryColorHex: string;
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const toColorPickerValue = (value: string, fallback: string) => {
    const trimmedValue = value.trim();

    if (!HEX_COLOR_PATTERN.test(trimmedValue)) {
        return fallback;
    }

    if (trimmedValue.length === 4) {
        const red = trimmedValue[1];
        const green = trimmedValue[2];
        const blue = trimmedValue[3];
        return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
    }

    return trimmedValue.toLowerCase();
};

const defaultValues: BrandCreateFormValues = {
    name: "",
    primaryColorHex: "#000000",
};

export function BrandFormDialog({ open, onOpenChange, onCreated }: BrandFormDialogProps) {
    const createBrand = useCreateBrand();
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<BrandCreateFormValues>({
        defaultValues,
    });

    useEffect(() => {
        if (open) {
            reset(defaultValues);
        }
    }, [open, reset]);

    const onSubmit = async (values: BrandCreateFormValues) => {
        const createdBrand = await createBrand.mutateAsync({
            name: values.name.trim(),
            primaryColorHex: values.primaryColorHex.trim(),
        });

        onOpenChange(false);
        onCreated?.(createdBrand);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (!nextOpen) {
                    reset(defaultValues);
                }
            }}
        >
            <DialogContent className="border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">Create brand</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Start with the required brand details now and manage the full profile from settings.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Field>
                        <FieldLabel>
                            <Label htmlFor="brand-name">Name</Label>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="brand-name"
                                autoFocus
                                placeholder="Hive Creative"
                                className="border-white/15 bg-white/5 text-zinc-100"
                                {...register("name", {
                                    required: "Brand name is required.",
                                    minLength: {
                                        value: 2,
                                        message: "Use at least 2 characters.",
                                    },
                                })}
                            />
                            <FieldError errors={[errors.name]} />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>
                            <Label htmlFor="brand-primary-color">Primary color</Label>
                        </FieldLabel>
                        <FieldContent>
                            <Controller
                                control={control}
                                name="primaryColorHex"
                                rules={{
                                    required: "Primary color is required.",
                                    validate: (value) =>
                                        HEX_COLOR_PATTERN.test(value.trim()) || "Use a valid hex color.",
                                }}
                                render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="color"
                                            aria-label="Pick primary color"
                                            className="h-8 w-11 shrink-0 cursor-pointer border-white/15 bg-white/5 p-1"
                                            value={toColorPickerValue(field.value, "#000000")}
                                            onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                                        />
                                        <Input
                                            id="brand-primary-color"
                                            placeholder="#000000"
                                            className="border-white/15 bg-white/5 text-zinc-100"
                                            value={field.value}
                                            onChange={(event) => field.onChange(event.target.value)}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </div>
                                )}
                            />
                            <FieldError errors={[errors.primaryColorHex]} />
                        </FieldContent>
                    </Field>

                    {createBrand.error?.message ? <p className="text-sm text-red-300">{createBrand.error.message}</p> : null}

                    <DialogFooter className="border-white/10 bg-zinc-950/80 sm:justify-between">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createBrand.isPending}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            {createBrand.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Creating
                                </>
                            ) : (
                                "Create brand"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
