"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { useDeleteBrand } from "@/components/brands/hooks";
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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteBrandDialogProps = {
    brand: Brand | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DeleteBrandDialog({ brand, open, onOpenChange }: DeleteBrandDialogProps) {
    const deleteBrand = useDeleteBrand();
    const [confirmName, setConfirmName] = useState("");

    useEffect(() => {
        if (open) {
            setConfirmName("");
        }
    }, [open, brand?.id]);

    const isConfirmationMatched = Boolean(brand) && confirmName.trim() === brand?.name;

    const onDelete = async () => {
        if (!brand) {
            return;
        }

        await deleteBrand.mutateAsync(brand.id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border border-red-500/20 bg-zinc-950 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100">Delete brand</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        This permanently removes <span className="font-medium text-zinc-200">{brand?.name}</span> and
                        all related settings. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <Field>
                    <FieldLabel>
                        <Label htmlFor="delete-brand-confirmation">
                            Type <span className="font-medium text-zinc-200">{brand?.name ?? "the brand name"}</span> to confirm
                        </Label>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id="delete-brand-confirmation"
                            value={confirmName}
                            onChange={(event) => setConfirmName(event.target.value)}
                            placeholder={brand?.name ?? "Brand name"}
                            className="border-white/15 bg-white/5 text-zinc-100"
                        />
                    </FieldContent>
                </Field>

                {deleteBrand.error?.message ? <p className="text-sm text-red-300">{deleteBrand.error.message}</p> : null}

                <DialogFooter className="border-white/10 bg-zinc-950/80 sm:justify-between">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Keep brand
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onDelete}
                        disabled={deleteBrand.isPending || !brand || !isConfirmationMatched}
                    >
                        {deleteBrand.isPending ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Deleting
                            </>
                        ) : (
                            <>
                                <Trash2 />
                                Delete brand
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
