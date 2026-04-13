export type BrandStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type BrandAssetRole =
    | "LOGO_PRIMARY"
    | "LOGO_SECONDARY"
    | "LOGO_MONO_LIGHT"
    | "LOGO_MONO_DARK"
    | "LOGO_MARK"
    | "LOGO_WORDMARK"
    | "LOGO_FAVICON"
    | "ICON_APP"
    | "TEMPLATE_COVER";

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export type Brand = {
    id: number;
    organizationId: number;
    name: string;
    slug: string;
    legalName: string | null;
    tagline: string | null;
    description: string | null;
    websiteUrl: string | null;
    supportEmail: string | null;
    status: BrandStatus;
    isDefault: boolean;
    primaryColorHex: string;
    secondaryColorHex: string | null;
    accentColorHex: string | null;
    neutralColorHex: string | null;
    palette: JsonValue | null;
    headingFontFamily: string | null;
    bodyFontFamily: string | null;
    fontFallbacks: JsonValue | null;
    typographyScale: JsonValue | null;
    logoGuidelines: string | null;
    colorGuidelines: string | null;
    typographyGuidelines: string | null;
    imageryGuidelines: string | null;
    toneGuidelines: string | null;
    accessibilityGuidelines: string | null;
    legalGuidelines: string | null;
    createdAt: string;
    updatedAt: string;
};

export type BrandAsset = {
    id: number;
    brandId: number;
    role: BrandAssetRole | null;
    url: string;
    storageKey: string | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    fileSizeBytes: number | null;
    checksumSha256: string | null;
    altText: string | null;
    createdAt: string;
    updatedAt: string;
};

export type BrandProject = {
    id: number;
    name: string;
    data: JsonValue;
    history: JsonValue[];
    brandId: number | null;
    createdAt: string;
    updatedAt: string;
};

type NullableBrandString = string | null;
type NullableBrandJson = JsonValue | null;

export type CreateBrandValues = {
    name: string;
    primaryColorHex: string;
    status?: BrandStatus;
    isDefault?: boolean;
    legalName?: NullableBrandString;
    tagline?: NullableBrandString;
    description?: NullableBrandString;
    websiteUrl?: NullableBrandString;
    supportEmail?: NullableBrandString;
    secondaryColorHex?: NullableBrandString;
    accentColorHex?: NullableBrandString;
    neutralColorHex?: NullableBrandString;
    headingFontFamily?: NullableBrandString;
    bodyFontFamily?: NullableBrandString;
    palette?: NullableBrandJson;
    fontFallbacks?: NullableBrandJson;
    typographyScale?: NullableBrandJson;
    logoGuidelines?: NullableBrandString;
    colorGuidelines?: NullableBrandString;
    typographyGuidelines?: NullableBrandString;
    imageryGuidelines?: NullableBrandString;
    toneGuidelines?: NullableBrandString;
    accessibilityGuidelines?: NullableBrandString;
    legalGuidelines?: NullableBrandString;
};

export type UpdateBrandValues = {
    name?: string;
    primaryColorHex?: string;
    status?: BrandStatus;
    isDefault?: boolean;
    legalName?: NullableBrandString;
    tagline?: NullableBrandString;
    description?: NullableBrandString;
    websiteUrl?: NullableBrandString;
    supportEmail?: NullableBrandString;
    secondaryColorHex?: NullableBrandString;
    accentColorHex?: NullableBrandString;
    neutralColorHex?: NullableBrandString;
    headingFontFamily?: NullableBrandString;
    bodyFontFamily?: NullableBrandString;
    palette?: NullableBrandJson;
    fontFallbacks?: NullableBrandJson;
    typographyScale?: NullableBrandJson;
    logoGuidelines?: NullableBrandString;
    colorGuidelines?: NullableBrandString;
    typographyGuidelines?: NullableBrandString;
    imageryGuidelines?: NullableBrandString;
    toneGuidelines?: NullableBrandString;
    accessibilityGuidelines?: NullableBrandString;
    legalGuidelines?: NullableBrandString;
};

export type CreateBrandAssetValues = {
    image: string;
    role?: BrandAssetRole;
    altText?: string | null;
};

export type UpdateBrandAssetValues = {
    role?: BrandAssetRole;
    url?: string;
    storageKey?: string | null;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    fileSizeBytes?: number | null;
    checksumSha256?: string | null;
    altText?: string | null;
};

export type CreateBrandProjectValues = {
    name: string;
    data: JsonValue;
    history?: JsonValue[];
};

export type UpdateBrandProjectValues = {
    name?: string;
    data?: JsonValue;
    history?: JsonValue[];
};

export type UpdateBrandPayload = {
    brandId: number;
    values: UpdateBrandValues;
};

export type CreateBrandAssetPayload = {
    brandId: number;
    values: CreateBrandAssetValues;
};

export type BrandAssetIdentifier = {
    brandId: number;
    assetId: number;
};

export type UpdateBrandAssetPayload = {
    brandId: number;
    assetId: number;
    values: UpdateBrandAssetValues;
};

export type CreateBrandProjectPayload = {
    brandId: number;
    values: CreateBrandProjectValues;
};

export type BrandProjectIdentifier = {
    brandId: number;
    projectId: number;
};

export type UpdateBrandProjectPayload = {
    brandId: number;
    projectId: number;
    values: UpdateBrandProjectValues;
};

export type DeleteBrandResponse = {
    message: string;
};

export type DeleteBrandAssetResponse = {
    message: string;
};

export type DeleteBrandProjectResponse = {
    message: string;
};
