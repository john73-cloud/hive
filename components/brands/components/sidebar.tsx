"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";
import {
    Check,
    ChevronsUpDown,
    Menu,
    Palette,
    PenLine,
    Plus,
    Settings,
    Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/auth/context/auth-context";
import { BrandFormDialog } from "@/components/brands/dialogs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import type { AgentDefinition } from "./context";
import { useBrandsContext } from "./context";

type BrandWorkspaceSidebarProps = {
    children: React.ReactNode;
};

type SidebarContentProps = {
    onCreateBrand: () => void;
};

const AGENT_ICONS: Record<AgentDefinition["id"], LucideIcon> = {
    graphics: Palette,
    branding: Sparkles,
    copywriting: PenLine,
};

const AGENT_ROUTES: Record<AgentDefinition["id"], string> = {
    graphics: "/graphics",
    branding: "/branding",
    copywriting: "/copywriting",
};

const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
        const parts = name
            .trim()
            .split(" ")
            .filter(Boolean)
            .slice(0, 2);

        if (parts.length) {
            return parts.map((part) => part[0]?.toUpperCase()).join("");
        }
    }

    if (email) {
        return email[0]?.toUpperCase() ?? "U";
    }

    return "U";
};

function SidebarContent({ onCreateBrand }: SidebarContentProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const {
        brands,
        isLoadingBrands,
        selectedBrand,
        selectedBrandId,
        setSelectedBrandId,
        agents,
    } = useBrandsContext();
    const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

    const userName = user?.name ?? "Agency User";
    const userEmail = user?.email ?? "No email on file";

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="space-y-4 border-b p-4">
                <div className="flex items-center gap-3 px-2">

                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <p className="truncate text-sm font-medium">Hive</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
                        >
                            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-medium bg-muted/50">
                                {(selectedBrand?.name ?? "B")[0]?.toUpperCase()}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                                <p className="truncate text-sm font-medium">{selectedBrand?.name ?? "Select brand"}</p>
                                <p className="truncate text-xs text-muted-foreground">Switch brand</p>
                            </div>
                            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuLabel>Brands</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isLoadingBrands ? <DropdownMenuItem disabled>Loading brands...</DropdownMenuItem> : null}
                        {!isLoadingBrands && brands.length === 0 ? (
                            <DropdownMenuItem disabled>No brands found.</DropdownMenuItem>
                        ) : null}
                        {!isLoadingBrands
                            ? brands.map((brand) => (
                                <DropdownMenuItem
                                    key={brand.id}
                                    onSelect={() => setSelectedBrandId(brand.id)}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <span className="truncate">{brand.name}</span>
                                    {selectedBrandId === brand.id ? <Check className="size-4" /> : null}
                                </DropdownMenuItem>
                            ))
                            : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={onCreateBrand}>
                            <Plus className="size-4" />
                            Create brand
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {selectedBrandId ? (
                    <Button
                        asChild
                        type="button"
                        variant={isSettingsActive ? "secondary" : "ghost"}
                        className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
                    >
                        <Link href="/settings">
                            <Settings className="size-4 shrink-0 text-muted-foreground" />
                            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                                <span className="truncate text-sm font-medium">Brand settings</span>
                                <span className="truncate text-xs text-muted-foreground">Manage profile and assets</span>
                            </div>
                        </Link>
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        disabled
                        className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
                    >
                        <Settings className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium">Brand settings</span>
                            <span className="truncate text-xs text-muted-foreground">Select a brand first</span>
                        </div>
                    </Button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <p className="px-2 text-xs text-muted-foreground">Agents</p>
                <div className="mt-2 space-y-1.5">
                    {agents.map((agent) => {
                        const Icon = AGENT_ICONS[agent.id];
                        const route = AGENT_ROUTES[agent.id];
                        const isActive =
                            agent.available && (pathname === route || pathname.startsWith(`${route}/`));

                        const content = (
                            <>
                                <Icon className="size-4 shrink-0 text-muted-foreground" />
                                <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left">
                                    <span className="truncate text-sm font-medium">{agent.label}</span>
                                    <span className="truncate text-xs text-muted-foreground">{agent.description}</span>
                                </div>
                                {!agent.available ? (
                                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">Soon</Badge>
                                ) : null}
                            </>
                        );

                        if (agent.available) {
                            return (
                                <Button
                                    key={agent.id}
                                    asChild
                                    type="button"
                                    variant={isActive ? "secondary" : "ghost"}
                                    className="h-auto w-full justify-start gap-3 px-3 py-2"
                                >
                                    <Link href={route}>{content}</Link>
                                </Button>
                            );
                        }

                        return (
                            <Button
                                key={agent.id}
                                type="button"
                                variant="ghost"
                                disabled
                                className="h-auto w-full justify-start gap-3 px-3 py-2"
                            >
                                {content}
                            </Button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
                        >
                            <Avatar className="size-8 shrink-0">
                                {user?.image ? <AvatarImage src={user.image} alt={userName} /> : null}
                                <AvatarFallback className="bg-muted/50 text-xs">{getUserInitials(user?.name, user?.email)}</AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                                <span className="truncate text-sm font-medium">{userName}</span>
                                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                            </div>
                            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuLabel>Profile</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Account settings</DropdownMenuItem>
                        <DropdownMenuItem>Team members</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export function BrandWorkspaceSidebar({ children }: BrandWorkspaceSidebarProps) {
    const pathname = usePathname();
    const { selectedBrand, setSelectedBrandId } = useBrandsContext();
    const [isCreateBrandOpen, setIsCreateBrandOpen] = useState(false);
    const isGraphicsEditorRoute = pathname.startsWith("/graphics/edit/");

    const openCreateBrandDialog = () => {
        setIsCreateBrandOpen(true);
    };

    return (
        <div className="flex min-h-svh bg-background text-foreground">
            {!isGraphicsEditorRoute ? (
                <aside className="hidden w-72 shrink-0 overflow-hidden border-r lg:flex">
                    <SidebarContent
                        onCreateBrand={openCreateBrandDialog}
                    />
                </aside>
            ) : null}

            <div className="flex min-h-svh min-w-0 flex-1 flex-col">
                {!isGraphicsEditorRoute ? (
                    <div className="sticky top-0 z-30 border-b bg-background px-4 py-3 lg:hidden">
                        <div className="flex items-center justify-between">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon-sm">
                                        <Menu className="size-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="left"
                                    showCloseButton
                                    className="w-[88%] max-w-sm overflow-hidden p-0"
                                >
                                    <SidebarContent
                                        onCreateBrand={openCreateBrandDialog}
                                    />
                                </SheetContent>
                            </Sheet>

                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Current brand</p>
                                <p className="max-w-44 truncate text-sm font-medium">
                                    {selectedBrand?.name ?? "No brand selected"}
                                </p>
                            </div>

                            {selectedBrand ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/settings">
                                        <Settings className="size-4" />
                                        Settings
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="min-h-0 flex-1">{children}</div>
            </div>

            <BrandFormDialog
                mode="create"
                open={isCreateBrandOpen}
                onOpenChange={setIsCreateBrandOpen}
                onCreated={(createdBrand: { id: number }) => setSelectedBrandId(createdBrand.id)}
            />
        </div>
    );
}
