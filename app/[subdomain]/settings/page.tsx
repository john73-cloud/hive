"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Save, Trash2, Upload } from "lucide-react";

import { useBrandsContext } from "@/components/brands/components/context";
import {
    useCreateBrandAsset,
    useDeleteBrand,
    useDeleteBrandAsset,
    useListBrandAssets,
    useUpdateBrand,
    useUpdateBrandAsset,
} from "@/components/brands/hooks";
import type {
    Brand,
    BrandAsset,
    BrandAssetRole,
    BrandStatus,
    JsonValue,
    UpdateBrandValues,
} from "@/components/brands/types";
import { Badge } from "@/components/ui/badge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type BrandSettingsValues = {
    name: string;
    primaryColorHex: string;
    status: BrandStatus;
    isDefault: boolean;
    legalName: string;
    tagline: string;
    description: string;
    websiteUrl: string;
    supportEmail: string;
    secondaryColorHex: string;
    accentColorHex: string;
    neutralColorHex: string;
    headingFontFamily: string;
    bodyFontFamily: string;
    palette: string;
    fontFallbacks: string;
    typographyScale: string;
    logoGuidelines: string;
    colorGuidelines: string;
    typographyGuidelines: string;
    imageryGuidelines: string;
    toneGuidelines: string;
    accessibilityGuidelines: string;
    legalGuidelines: string;
};

type CreateBrandAssetValues = {
    role: BrandAssetRole;
    imageUrl: string;
    altText: string;
};

type EditBrandAssetValues = {
    role: BrandAssetRole;
    url: string;
    altText: string;
    mimeType: string;
    width: string;
    height: string;
    fileSizeBytes: string;
    storageKey: string;
    checksumSha256: string;
};

const STATUS_OPTIONS: BrandStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const ASSET_ROLE_OPTIONS: BrandAssetRole[] = [
    "LOGO_PRIMARY",
    "LOGO_SECONDARY",
    "LOGO_MONO_LIGHT",
    "LOGO_MONO_DARK",
    "LOGO_MARK",
    "LOGO_WORDMARK",
    "LOGO_FAVICON",
    "ICON_APP",
    "TEMPLATE_COVER",
];
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseJsonValue = (value: string): JsonValue | null => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    return JSON.parse(trimmedValue) as JsonValue;
};

const stringifyJsonValue = (value: JsonValue | null) => {
    if (value === null) {
        return "";
    }

    return JSON.stringify(value, null, 2);
};

const toNullableString = (value: string) => {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
};

const toNullableInteger = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const parsed = Number.parseInt(trimmedValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const validateJsonValue = (value: string) => {
    if (!value.trim()) {
        return true;
    }

    try {
        JSON.parse(value);
        return true;
    } catch {
        return "Provide valid JSON.";
    }
};

const validateOptionalHexColor = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return true;
    }

    return HEX_COLOR_PATTERN.test(trimmedValue) || "Use a valid hex color.";
};

const validateWebsiteUrl = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return true;
    }

    try {
        const url = new URL(trimmedValue);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "Use a URL starting with http:// or https://.";
        }

        return true;
    } catch {
        return "Use a valid URL.";
    }
};

const validateEmail = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return true;
    }

    return EMAIL_PATTERN.test(trimmedValue) || "Use a valid email address.";
};

const validateNonNegativeInteger = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return true;
    }

    return /^\d+$/.test(trimmedValue) || "Use a non-negative integer.";
};

const readFileAsDataUrl = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
            }

            reject(new Error("Unable to read file."));
        };
        reader.onerror = () => {
            reject(new Error("Unable to read file."));
        };

        reader.readAsDataURL(file);
    });
};

const buildDefaultValues = (brand?: Brand | null): BrandSettingsValues => ({
    name: brand?.name ?? "",
    primaryColorHex: brand?.primaryColorHex ?? "#000000",
    status: brand?.status ?? "ACTIVE",
    isDefault: brand?.isDefault ?? false,
    legalName: brand?.legalName ?? "",
    tagline: brand?.tagline ?? "",
    description: brand?.description ?? "",
    websiteUrl: brand?.websiteUrl ?? "",
    supportEmail: brand?.supportEmail ?? "",
    secondaryColorHex: brand?.secondaryColorHex ?? "",
    accentColorHex: brand?.accentColorHex ?? "",
    neutralColorHex: brand?.neutralColorHex ?? "",
    headingFontFamily: brand?.headingFontFamily ?? "",
    bodyFontFamily: brand?.bodyFontFamily ?? "",
    palette: stringifyJsonValue(brand?.palette ?? null),
    fontFallbacks: stringifyJsonValue(brand?.fontFallbacks ?? null),
    typographyScale: stringifyJsonValue(brand?.typographyScale ?? null),
    logoGuidelines: brand?.logoGuidelines ?? "",
    colorGuidelines: brand?.colorGuidelines ?? "",
    typographyGuidelines: brand?.typographyGuidelines ?? "",
    imageryGuidelines: brand?.imageryGuidelines ?? "",
    toneGuidelines: brand?.toneGuidelines ?? "",
    accessibilityGuidelines: brand?.accessibilityGuidelines ?? "",
    legalGuidelines: brand?.legalGuidelines ?? "",
});

const buildUpdatePayload = (values: BrandSettingsValues): UpdateBrandValues => ({
    name: values.name.trim(),
    primaryColorHex: values.primaryColorHex.trim(),
    status: values.status,
    isDefault: values.isDefault,
    legalName: toNullableString(values.legalName),
    tagline: toNullableString(values.tagline),
    description: toNullableString(values.description),
    websiteUrl: toNullableString(values.websiteUrl),
    supportEmail: toNullableString(values.supportEmail),
    secondaryColorHex: toNullableString(values.secondaryColorHex),
    accentColorHex: toNullableString(values.accentColorHex),
    neutralColorHex: toNullableString(values.neutralColorHex),
    headingFontFamily: toNullableString(values.headingFontFamily),
    bodyFontFamily: toNullableString(values.bodyFontFamily),
    palette: parseJsonValue(values.palette),
    fontFallbacks: parseJsonValue(values.fontFallbacks),
    typographyScale: parseJsonValue(values.typographyScale),
    logoGuidelines: toNullableString(values.logoGuidelines),
    colorGuidelines: toNullableString(values.colorGuidelines),
    typographyGuidelines: toNullableString(values.typographyGuidelines),
    imageryGuidelines: toNullableString(values.imageryGuidelines),
    toneGuidelines: toNullableString(values.toneGuidelines),
    accessibilityGuidelines: toNullableString(values.accessibilityGuidelines),
    legalGuidelines: toNullableString(values.legalGuidelines),
});

const createAssetDefaults: CreateBrandAssetValues = {
    role: "LOGO_PRIMARY",
    imageUrl: "",
    altText: "",
};

const buildEditAssetDefaults = (asset: BrandAsset | null): EditBrandAssetValues => ({
    role: asset?.role ?? "LOGO_PRIMARY",
    url: asset?.url ?? "",
    altText: asset?.altText ?? "",
    mimeType: asset?.mimeType ?? "",
    width: asset?.width !== null && asset?.width !== undefined ? String(asset.width) : "",
    height: asset?.height !== null && asset?.height !== undefined ? String(asset.height) : "",
    fileSizeBytes:
        asset?.fileSizeBytes !== null && asset?.fileSizeBytes !== undefined ? String(asset.fileSizeBytes) : "",
    storageKey: asset?.storageKey ?? "",
    checksumSha256: asset?.checksumSha256 ?? "",
});

export default function BrandSettingsPage() {
    const router = useRouter();
    const { selectedBrandId, selectedBrand, isLoadingBrands } = useBrandsContext();

    const updateBrand = useUpdateBrand();
    const deleteBrand = useDeleteBrand();
    const createBrandAsset = useCreateBrandAsset();
    const updateBrandAsset = useUpdateBrandAsset();
    const deleteBrandAsset = useDeleteBrandAsset();

    const {
        data: assets,
        isPending: isPendingAssets,
        isError: isErrorAssets,
        error: assetsError,
    } = useListBrandAssets(selectedBrandId);

    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [assetCreateError, setAssetCreateError] = useState<string | null>(null);
    const [assetToEdit, setAssetToEdit] = useState<BrandAsset | null>(null);
    const [brandDeleteState, setBrandDeleteState] = useState<{ brandId: number | null; value: string }>({
        brandId: null,
        value: "",
    });

    const brandDefaultValues = useMemo(() => buildDefaultValues(selectedBrand), [selectedBrand]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<BrandSettingsValues>({
        defaultValues: brandDefaultValues,
    });

    const {
        register: registerCreateAsset,
        handleSubmit: handleCreateAssetSubmit,
        reset: resetCreateAsset,
        control: createAssetControl,
        formState: { errors: createAssetErrors },
    } = useForm<CreateBrandAssetValues>({
        defaultValues: createAssetDefaults,
    });

    const {
        register: registerEditAsset,
        handleSubmit: handleEditAssetSubmit,
        reset: resetEditAsset,
        control: editAssetControl,
        formState: { errors: editAssetErrors },
    } = useForm<EditBrandAssetValues>({
        defaultValues: buildEditAssetDefaults(assetToEdit),
    });

    useEffect(() => {
        reset(brandDefaultValues);
    }, [brandDefaultValues, reset]);

    useEffect(() => {
        resetEditAsset(buildEditAssetDefaults(assetToEdit));
    }, [assetToEdit, resetEditAsset]);

    const onUpdateBrand = async (values: BrandSettingsValues) => {
        if (!selectedBrandId) {
            return;
        }

        await updateBrand.mutateAsync({
            brandId: selectedBrandId,
            values: buildUpdatePayload(values),
        });
    };

    const onCreateBrandAsset = async (values: CreateBrandAssetValues) => {
        if (!selectedBrandId) {
            return;
        }

        setAssetCreateError(null);

        const fallbackImage = values.imageUrl.trim();

        if (!assetFile && !fallbackImage) {
            setAssetCreateError("Select a file or provide an image URL.");
            return;
        }

        const image = assetFile ? await readFileAsDataUrl(assetFile) : fallbackImage;

        await createBrandAsset.mutateAsync({
            brandId: selectedBrandId,
            values: {
                image,
                role: values.role,
                altText: toNullableString(values.altText),
            },
        });

        resetCreateAsset(createAssetDefaults);
        setAssetFile(null);
    };

    const onUpdateBrandAsset = async (values: EditBrandAssetValues) => {
        if (!selectedBrandId || !assetToEdit) {
            return;
        }

        await updateBrandAsset.mutateAsync({
            brandId: selectedBrandId,
            assetId: assetToEdit.id,
            values: {
                role: values.role,
                url: values.url.trim(),
                altText: toNullableString(values.altText),
                mimeType: toNullableString(values.mimeType),
                width: toNullableInteger(values.width),
                height: toNullableInteger(values.height),
                fileSizeBytes: toNullableInteger(values.fileSizeBytes),
                storageKey: toNullableString(values.storageKey),
                checksumSha256: toNullableString(values.checksumSha256),
            },
        });

        setAssetToEdit(null);
    };

    const onDeleteBrandAsset = async (assetId: number) => {
        if (!selectedBrandId) {
            return;
        }

        await deleteBrandAsset.mutateAsync({ brandId: selectedBrandId, assetId });
    };

    const onDeleteBrand = async () => {
        if (!selectedBrandId || !selectedBrand) {
            return;
        }

        await deleteBrand.mutateAsync(selectedBrandId);
        router.replace("/");
    };

    const canDeleteSelectedBrand =
        Boolean(selectedBrand) &&
        brandDeleteState.brandId === selectedBrandId &&
        brandDeleteState.value.trim() === (selectedBrand?.name ?? "");

    const brandDeleteConfirmation =
        brandDeleteState.brandId === selectedBrandId ? brandDeleteState.value : "";

    if (isLoadingBrands && !selectedBrandId) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-workspace-canvas text-zinc-300">
                Loading brand settings...
            </div>
        );
    }

    if (!selectedBrandId || !selectedBrand) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-workspace-canvas text-zinc-300">
                Select a brand to manage settings.
            </div>
        );
    }

    return (
        <main className="min-h-svh bg-workspace-canvas text-zinc-100">
            <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
                <header className="border-b border-white/10 pb-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Brand settings</p>
                    <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-zinc-100 sm:text-4xl">
                        {selectedBrand.name}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                        Manage your complete brand profile, style tokens, guidelines, and asset library.
                    </p>
                </header>

                <form onSubmit={handleSubmit(onUpdateBrand)} className="space-y-6">
                    <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                        <div className="border-b border-white/10 pb-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Identity</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-name">Name</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-name"
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
                                    <Label htmlFor="brand-legal-name">Legal name</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-legal-name"
                                        placeholder="Hive Creative LLC"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("legalName")}
                                    />
                                    <FieldError errors={[errors.legalName]} />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-tagline">Tagline</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="brand-tagline"
                                    placeholder="Design systems built for speed"
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("tagline")}
                                />
                                <FieldError errors={[errors.tagline]} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-description">Description</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-description"
                                    rows={3}
                                    placeholder="Short summary of what this brand represents."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("description")}
                                />
                                <FieldError errors={[errors.description]} />
                            </FieldContent>
                        </Field>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-status">Status</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="status"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id="brand-status" className="w-full border-white/15 bg-white/5 text-zinc-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field className="rounded-md border border-white/10 px-3 py-2">
                                <FieldLabel>
                                    <Label htmlFor="brand-is-default">Set as default brand</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="isDefault"
                                        render={({ field }) => (
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-xs text-zinc-400">
                                                    New projects will use this brand by default.
                                                </p>
                                                <Switch
                                                    id="brand-is-default"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </div>
                                        )}
                                    />
                                </FieldContent>
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                        <div className="border-b border-white/10 pb-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Contact</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-website-url">Website URL</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-website-url"
                                        type="url"
                                        placeholder="https://example.com"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("websiteUrl", {
                                            validate: validateWebsiteUrl,
                                        })}
                                    />
                                    <FieldError errors={[errors.websiteUrl]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-support-email">Support email</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-support-email"
                                        type="email"
                                        placeholder="support@example.com"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("supportEmail", {
                                            validate: validateEmail,
                                        })}
                                    />
                                    <FieldError errors={[errors.supportEmail]} />
                                </FieldContent>
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                        <div className="border-b border-white/10 pb-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Styling</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-primary-color">Primary color</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-primary-color"
                                        placeholder="#0f172a"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("primaryColorHex", {
                                            required: "Primary color is required.",
                                            validate: (value) =>
                                                HEX_COLOR_PATTERN.test(value.trim()) || "Use a valid hex color.",
                                        })}
                                    />
                                    <FieldError errors={[errors.primaryColorHex]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-secondary-color">Secondary color</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-secondary-color"
                                        placeholder="#f97316"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("secondaryColorHex", {
                                            validate: validateOptionalHexColor,
                                        })}
                                    />
                                    <FieldError errors={[errors.secondaryColorHex]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-accent-color">Accent color</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-accent-color"
                                        placeholder="#0ea5e9"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("accentColorHex", {
                                            validate: validateOptionalHexColor,
                                        })}
                                    />
                                    <FieldError errors={[errors.accentColorHex]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-neutral-color">Neutral color</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-neutral-color"
                                        placeholder="#475569"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("neutralColorHex", {
                                            validate: validateOptionalHexColor,
                                        })}
                                    />
                                    <FieldError errors={[errors.neutralColorHex]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-heading-font">Heading font family</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-heading-font"
                                        placeholder="Sora"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("headingFontFamily")}
                                    />
                                    <FieldError errors={[errors.headingFontFamily]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="brand-body-font">Body font family</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="brand-body-font"
                                        placeholder="Inter"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...register("bodyFontFamily")}
                                    />
                                    <FieldError errors={[errors.bodyFontFamily]} />
                                </FieldContent>
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                        <div className="border-b border-white/10 pb-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Design Data (JSON)</p>
                        </div>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-palette">Palette</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-palette"
                                    rows={4}
                                    placeholder='{"primary": "#0f172a"}'
                                    className="font-mono text-xs border-white/15 bg-white/5 text-zinc-100"
                                    {...register("palette", { validate: validateJsonValue })}
                                />
                                <FieldError errors={[errors.palette]} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-font-fallbacks">Font fallbacks</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-font-fallbacks"
                                    rows={4}
                                    placeholder='["Inter", "system-ui", "sans-serif"]'
                                    className="font-mono text-xs border-white/15 bg-white/5 text-zinc-100"
                                    {...register("fontFallbacks", { validate: validateJsonValue })}
                                />
                                <FieldError errors={[errors.fontFallbacks]} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-typography-scale">Typography scale</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-typography-scale"
                                    rows={4}
                                    placeholder='{"h1": "48px", "body": "16px"}'
                                    className="font-mono text-xs border-white/15 bg-white/5 text-zinc-100"
                                    {...register("typographyScale", { validate: validateJsonValue })}
                                />
                                <FieldError errors={[errors.typographyScale]} />
                            </FieldContent>
                        </Field>
                    </section>

                    <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                        <div className="border-b border-white/10 pb-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Guidelines</p>
                        </div>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-logo-guidelines">Logo guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-logo-guidelines"
                                    rows={3}
                                    placeholder="How logos should be used across channels."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("logoGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-color-guidelines">Color guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-color-guidelines"
                                    rows={3}
                                    placeholder="Contrast, pairing, and usage rules."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("colorGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-typography-guidelines">Typography guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-typography-guidelines"
                                    rows={3}
                                    placeholder="Hierarchy, spacing, and readability rules."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("typographyGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-imagery-guidelines">Imagery guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-imagery-guidelines"
                                    rows={3}
                                    placeholder="Photography, illustration, and visual treatment notes."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("imageryGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-tone-guidelines">Tone guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-tone-guidelines"
                                    rows={3}
                                    placeholder="Voice and tone expectations for written content."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("toneGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-accessibility-guidelines">Accessibility guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-accessibility-guidelines"
                                    rows={3}
                                    placeholder="Accessibility rules and acceptance criteria."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("accessibilityGuidelines")}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="brand-legal-guidelines">Legal guidelines</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="brand-legal-guidelines"
                                    rows={3}
                                    placeholder="Trademark, usage rights, and required notices."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...register("legalGuidelines")}
                                />
                            </FieldContent>
                        </Field>
                    </section>

                    {updateBrand.error?.message ? <p className="text-sm text-red-300">{updateBrand.error.message}</p> : null}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={updateBrand.isPending}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        >
                            {updateBrand.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Saving
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Save settings
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <section className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-5">
                    <div className="border-b border-white/10 pb-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Brand assets</p>
                    </div>

                    <form onSubmit={handleCreateAssetSubmit(onCreateBrandAsset)} className="space-y-4 rounded-lg border border-white/10 bg-white/4 p-4">
                        <p className="text-sm font-medium text-zinc-200">Add asset</p>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="asset-role">Role</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={createAssetControl}
                                        name="role"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id="asset-role" className="w-full border-white/15 bg-white/5 text-zinc-100">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ASSET_ROLE_OPTIONS.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="asset-file">Upload image</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="asset-file"
                                        type="file"
                                        accept="image/*"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] ?? null;
                                            setAssetFile(file);
                                        }}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="asset-image-url">Image URL fallback</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="asset-image-url"
                                        type="url"
                                        placeholder="https://cdn.example.com/logo.svg"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerCreateAsset("imageUrl")}
                                    />
                                    <FieldError errors={[createAssetErrors.imageUrl]} />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="asset-alt-text">Alt text</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="asset-alt-text"
                                    rows={2}
                                    placeholder="Describe this asset for accessibility."
                                    className="border-white/15 bg-white/5 text-zinc-100"
                                    {...registerCreateAsset("altText")}
                                />
                            </FieldContent>
                        </Field>

                        <p className="text-xs text-zinc-500">
                            If a file is selected, it will be used as image input. Otherwise, the URL fallback is used.
                        </p>

                        {assetCreateError ? <p className="text-sm text-red-300">{assetCreateError}</p> : null}
                        {createBrandAsset.error?.message ? <p className="text-sm text-red-300">{createBrandAsset.error.message}</p> : null}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={createBrandAsset.isPending}>
                                {createBrandAsset.isPending ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Uploading
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-4" />
                                        Create asset
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {isPendingAssets ? <p className="text-sm text-zinc-400">Loading assets...</p> : null}
                    {isErrorAssets ? <p className="text-sm text-red-300">{assetsError?.message ?? "Unable to load assets."}</p> : null}

                    {!isPendingAssets && assets && assets.length === 0 ? (
                        <p className="text-sm text-zinc-400">No assets yet. Add your first logo, icon, or template.</p>
                    ) : null}

                    {!isPendingAssets && assets && assets.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10">
                                        <TableHead className="text-zinc-300">Role</TableHead>
                                        <TableHead className="text-zinc-300">URL</TableHead>
                                        <TableHead className="text-zinc-300">Metadata</TableHead>
                                        <TableHead className="text-zinc-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.map((asset) => (
                                        <TableRow key={asset.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell>
                                                <Badge variant="outline" className="border-white/15 text-zinc-200">
                                                    {asset.role ?? "UNASSIGNED"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-104 truncate text-zinc-300">
                                                {asset.url}
                                            </TableCell>
                                            <TableCell className="text-zinc-400">
                                                {asset.mimeType ? <span>{asset.mimeType}</span> : <span>No mime</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setAssetToEdit(asset)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={deleteBrandAsset.isPending}
                                                        onClick={() => onDeleteBrandAsset(asset.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}
                </section>

                <section className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/6 p-5">
                    <div className="border-b border-red-500/25 pb-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-red-300">Danger zone</p>
                    </div>

                    <p className="text-sm text-zinc-200">
                        Deleting this brand removes its profile and related settings permanently.
                    </p>

                    <Field>
                        <FieldLabel>
                            <Label htmlFor="delete-brand-confirmation" className="text-zinc-200">
                                Type {selectedBrand.name} to confirm
                            </Label>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="delete-brand-confirmation"
                                value={brandDeleteConfirmation}
                                onChange={(event) =>
                                    setBrandDeleteState({
                                        brandId: selectedBrandId,
                                        value: event.target.value,
                                    })
                                }
                                placeholder={selectedBrand.name}
                                className="border-red-400/30 bg-red-500/8 text-zinc-100"
                            />
                        </FieldContent>
                    </Field>

                    {deleteBrand.error?.message ? <p className="text-sm text-red-300">{deleteBrand.error.message}</p> : null}

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!canDeleteSelectedBrand || deleteBrand.isPending}
                            onClick={onDeleteBrand}
                        >
                            {deleteBrand.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Deleting
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    Delete brand
                                </>
                            )}
                        </Button>
                    </div>
                </section>
            </section>

            <Dialog open={Boolean(assetToEdit)} onOpenChange={(open) => !open && setAssetToEdit(null)}>
                <DialogContent className="border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-100">Edit brand asset</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Update role, URL, and optional metadata for this asset.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditAssetSubmit(onUpdateBrandAsset)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-role">Role</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={editAssetControl}
                                        name="role"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id="edit-asset-role" className="w-full border-white/15 bg-white/5 text-zinc-100">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ASSET_ROLE_OPTIONS.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-url">Asset URL</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-url"
                                        type="url"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("url", {
                                            required: "Asset URL is required.",
                                        })}
                                    />
                                    <FieldError errors={[editAssetErrors.url]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-alt-text">Alt text</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-alt-text"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("altText")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-mime-type">MIME type</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-mime-type"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("mimeType")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-width">Width</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-width"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("width", {
                                            validate: validateNonNegativeInteger,
                                        })}
                                    />
                                    <FieldError errors={[editAssetErrors.width]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-height">Height</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-height"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("height", {
                                            validate: validateNonNegativeInteger,
                                        })}
                                    />
                                    <FieldError errors={[editAssetErrors.height]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-file-size">File size (bytes)</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-file-size"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("fileSizeBytes", {
                                            validate: validateNonNegativeInteger,
                                        })}
                                    />
                                    <FieldError errors={[editAssetErrors.fileSizeBytes]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-storage-key">Storage key</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-storage-key"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("storageKey")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field className="md:col-span-2">
                                <FieldLabel>
                                    <Label htmlFor="edit-asset-checksum">Checksum (sha256)</Label>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-asset-checksum"
                                        className="border-white/15 bg-white/5 text-zinc-100"
                                        {...registerEditAsset("checksumSha256")}
                                    />
                                </FieldContent>
                            </Field>
                        </div>

                        {updateBrandAsset.error?.message ? (
                            <p className="text-sm text-red-300">{updateBrandAsset.error.message}</p>
                        ) : null}

                        <DialogFooter className="border-white/10 bg-zinc-950/80 sm:justify-between">
                            <Button type="button" variant="ghost" onClick={() => setAssetToEdit(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateBrandAsset.isPending}>
                                {updateBrandAsset.isPending ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Saving
                                    </>
                                ) : (
                                    "Save asset"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
