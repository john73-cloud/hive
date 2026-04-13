"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { useListBrands } from "../hooks";
import type { Brand } from "../types";

export type AgentType = "graphics" | "branding" | "copywriting";

export type AgentDefinition = {
    id: AgentType;
    label: string;
    description: string;
    available: boolean;
};

const AGENT_OPTIONS: AgentDefinition[] = [
    {
        id: "graphics",
        label: "Graphics Agent",
        description: "Design, templates, and visual production",
        available: true,
    },
    {
        id: "branding",
        label: "Brand Strategy Agent",
        description: "Positioning, messaging, and brand systems",
        available: false,
    },
    {
        id: "copywriting",
        label: "Copywriting Agent",
        description: "Campaign copy, scripts, and content editing",
        available: false,
    },
];

type BrandsContextValue = {
    brands: Brand[];
    isLoadingBrands: boolean;
    isErrorBrands: boolean;
    selectedBrand: Brand | null;
    selectedBrandId: number | null;
    setSelectedBrandId: (brandId: number) => void;
    agents: AgentDefinition[];
};

const BrandsStateContext = createContext<BrandsContextValue | undefined>(undefined);

export function BrandsContext({ children }: React.PropsWithChildren) {
    const { data, isPending, isError } = useListBrands();
    const brands = useMemo(() => data ?? [], [data]);

    const [selectedBrandIdState, setSelectedBrandIdState] = useState<number | null>(null);

    const fallbackBrandId = useMemo(() => {
        if (!brands.length) {
            return null;
        }

        const defaultBrand = brands.find((brand) => brand.isDefault) ?? brands[0];
        return defaultBrand.id;
    }, [brands]);

    const selectedBrandId = useMemo(() => {
        if (!brands.length) {
            return null;
        }

        if (selectedBrandIdState && brands.some((brand) => brand.id === selectedBrandIdState)) {
            return selectedBrandIdState;
        }

        return fallbackBrandId;
    }, [brands, selectedBrandIdState, fallbackBrandId]);

    const selectedBrand = useMemo(
        () => brands.find((brand) => brand.id === selectedBrandId) ?? null,
        [brands, selectedBrandId]
    );

    const setSelectedBrandId = (brandId: number) => {
        setSelectedBrandIdState(brandId);
    };

    const value = useMemo<BrandsContextValue>(
        () => ({
            brands,
            isLoadingBrands: isPending,
            isErrorBrands: isError,
            selectedBrand,
            selectedBrandId,
            setSelectedBrandId,
            agents: AGENT_OPTIONS,
        }),
        [brands, isPending, isError, selectedBrand, selectedBrandId]
    );

    return <BrandsStateContext.Provider value={value}>{children}</BrandsStateContext.Provider>;
}

export function useBrandsContext() {
    const context = useContext(BrandsStateContext);

    if (!context) {
        throw new Error("useBrandsContext must be used within BrandsContext");
    }

    return context;
}
