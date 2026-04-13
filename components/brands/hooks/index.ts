"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestApi } from "@/hooks/use-fetch";

import type {
    Brand,
    BrandAsset,
    BrandAssetIdentifier,
    BrandProject,
    BrandProjectIdentifier,
    CreateBrandAssetPayload,
    CreateBrandProjectPayload,
    CreateBrandValues,
    DeleteBrandAssetResponse,
    DeleteBrandProjectResponse,
    DeleteBrandResponse,
    UpdateBrandAssetPayload,
    UpdateBrandPayload,
    UpdateBrandProjectPayload,
} from "../types";

const createBrand = async (values: CreateBrandValues) => {
    const response = await requestApi<Brand>({
        url: "/brands",
        method: "POST",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to create brand.");
    }

    return response.data as Brand;
};

export function useCreateBrand() {
    const queryClient = useQueryClient();

    return useMutation<Brand, Error, CreateBrandValues>({
        mutationFn: createBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const listBrands = async () => {
    const response = await requestApi<Brand[]>({
        url: "/brands",
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brands.");
    }

    return response.data as Brand[];
};

export function useListBrands() {
    return useQuery({
        queryKey: ["brands"],
        queryFn: listBrands,
    });
}

const getBrandById = async (brandId: number) => {
    const response = await requestApi<Brand>({
        url: `/brands/${brandId}`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brand.");
    }

    return response.data as Brand;
};

export function useGetBrand(brandId: number) {
    return useQuery({
        queryKey: ["brands", brandId],
        queryFn: () => getBrandById(brandId),
    });
}

const updateBrand = async ({ brandId, values }: UpdateBrandPayload) => {
    const response = await requestApi<Brand>({
        url: `/brands/${brandId}`,
        method: "PUT",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to update brand.");
    }

    return response.data as Brand;
};

export function useUpdateBrand() {
    const queryClient = useQueryClient();

    return useMutation<Brand, Error, UpdateBrandPayload>({
        mutationFn: updateBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const deleteBrand = async (brandId: number) => {
    const response = await requestApi<DeleteBrandResponse>({
        url: `/brands/${brandId}`,
        method: "DELETE",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to delete brand.");
    }

    return response.data as DeleteBrandResponse;
};

export function useDeleteBrand() {
    const queryClient = useQueryClient();

    return useMutation<DeleteBrandResponse, Error, number>({
        mutationFn: deleteBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const createBrandAsset = async ({ brandId, values }: CreateBrandAssetPayload) => {
    const response = await requestApi<BrandAsset>({
        url: `/brands/${brandId}/assets`,
        method: "POST",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to create brand asset.");
    }

    return response.data as BrandAsset;
};

export function useCreateBrandAsset() {
    const queryClient = useQueryClient();

    return useMutation<BrandAsset, Error, CreateBrandAssetPayload>({
        mutationFn: createBrandAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const listBrandAssets = async (brandId: number) => {
    const response = await requestApi<BrandAsset[]>({
        url: `/brands/${brandId}/assets`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brand assets.");
    }

    return response.data as BrandAsset[];
};

export function useListBrandAssets(brandId: number) {
    return useQuery({
        queryKey: ["brands", brandId, "assets"],
        queryFn: () => listBrandAssets(brandId),
    });
}

const getBrandAssetById = async ({ brandId, assetId }: BrandAssetIdentifier) => {
    const response = await requestApi<BrandAsset>({
        url: `/brands/${brandId}/assets/${assetId}`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brand asset.");
    }

    return response.data as BrandAsset;
};

export function useGetBrandAsset(brandId: number, assetId: number) {
    return useQuery({
        queryKey: ["brands", brandId, "assets", assetId],
        queryFn: () => getBrandAssetById({ brandId, assetId }),
    });
}

const updateBrandAsset = async ({ brandId, assetId, values }: UpdateBrandAssetPayload) => {
    const response = await requestApi<BrandAsset>({
        url: `/brands/${brandId}/assets/${assetId}`,
        method: "PUT",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to update brand asset.");
    }

    return response.data as BrandAsset;
};

export function useUpdateBrandAsset() {
    const queryClient = useQueryClient();

    return useMutation<BrandAsset, Error, UpdateBrandAssetPayload>({
        mutationFn: updateBrandAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const deleteBrandAsset = async ({ brandId, assetId }: BrandAssetIdentifier) => {
    const response = await requestApi<DeleteBrandAssetResponse>({
        url: `/brands/${brandId}/assets/${assetId}`,
        method: "DELETE",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to delete brand asset.");
    }

    return response.data as DeleteBrandAssetResponse;
};

export function useDeleteBrandAsset() {
    const queryClient = useQueryClient();

    return useMutation<DeleteBrandAssetResponse, Error, BrandAssetIdentifier>({
        mutationFn: deleteBrandAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const createBrandProject = async ({ brandId, values }: CreateBrandProjectPayload) => {
    const response = await requestApi<BrandProject>({
        url: `/brands/${brandId}/projects`,
        method: "POST",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to create brand project.");
    }

    return response.data as BrandProject;
};

export function useCreateBrandProject() {
    const queryClient = useQueryClient();

    return useMutation<BrandProject, Error, CreateBrandProjectPayload>({
        mutationFn: createBrandProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const listBrandProjects = async (brandId: number) => {
    const response = await requestApi<BrandProject[]>({
        url: `/brands/${brandId}/projects`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brand projects.");
    }

    return response.data as BrandProject[];
};

export function useListBrandProjects(brandId: number) {
    return useQuery({
        queryKey: ["brands", brandId, "projects"],
        queryFn: () => listBrandProjects(brandId),
    });
}

const getBrandProjectById = async ({ brandId, projectId }: BrandProjectIdentifier) => {
    const response = await requestApi<BrandProject>({
        url: `/brands/${brandId}/projects/${projectId}`,
        method: "GET",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to fetch brand project.");
    }

    return response.data as BrandProject;
};

export function useGetBrandProject(brandId: number | null, projectId: number) {
    const isEnabled =
        typeof brandId === "number" &&
        Number.isInteger(brandId) &&
        brandId > 0 &&
        Number.isInteger(projectId) &&
        projectId > 0;

    return useQuery({
        queryKey: ["brands", brandId, "projects", projectId],
        enabled: isEnabled,
        queryFn: () => getBrandProjectById({ brandId: brandId as number, projectId }),
    });
}

const updateBrandProject = async ({ brandId, projectId, values }: UpdateBrandProjectPayload) => {
    const response = await requestApi<BrandProject>({
        url: `/brands/${brandId}/projects/${projectId}`,
        method: "PUT",
        body: values,
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to update brand project.");
    }

    return response.data as BrandProject;
};

export function useUpdateBrandProject() {
    const queryClient = useQueryClient();

    return useMutation<BrandProject, Error, UpdateBrandProjectPayload>({
        mutationFn: updateBrandProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

const deleteBrandProject = async ({ brandId, projectId }: BrandProjectIdentifier) => {
    const response = await requestApi<DeleteBrandProjectResponse>({
        url: `/brands/${brandId}/projects/${projectId}`,
        method: "DELETE",
        auth: "required",
    });

    if (!response.success) {
        throw new Error(response.error ?? "Unable to delete brand project.");
    }

    return response.data as DeleteBrandProjectResponse;
};

export function useDeleteBrandProject() {
    const queryClient = useQueryClient();

    return useMutation<DeleteBrandProjectResponse, Error, BrandProjectIdentifier>({
        mutationFn: deleteBrandProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}