"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/context/auth-context";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    fetchUserOrganization,
    useCreateOrganization,
    useUserOrganization,
} from "./hooks/use-organization";
import type { CreateOrganizationFormValues } from "./types";
import { redirectToSubdomain, slugifyBrandName } from "@/lib/utils";

const sanitizeDomainInput = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-{2,}/g, "-");

function OrganizationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;
    const organizationQuery = useUserOrganization(userId);
    const createOrganizationMutation = useCreateOrganization();
    const isCheckingOrganization = organizationQuery.isFetching;
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<CreateOrganizationFormValues>({
        defaultValues: {
            organizationName: "",
            domainName: "",
        },
    });

    const onSubmit = async (values: CreateOrganizationFormValues) => {
        if (!userId) {
            toast.error("Authentication required. Please sign in.");
            router.replace("/login?next=%2Forganization");
            return;
        }

        try {
            const payload = await createOrganizationMutation.mutateAsync(values);
            await queryClient.invalidateQueries({
                queryKey: ["auth", "organization", userId],
            });

            const createdDomain = payload.user.organization.domain.name;
            toast.success(payload.message || "Organization created successfully.");

            if (createdDomain) {
                redirectToSubdomain(createdDomain, "/")
                return;
            }

            if (userId) {
                const fallbackOrganization = await fetchUserOrganization(userId);
                const fallbackDomain = fallbackOrganization.domain.name;
                redirectToSubdomain(fallbackDomain, "/")
                return;
            }
            router.replace("/");
        } catch (error: any) {
            toast.error(error?.message ?? "Unable to create organization.");
        }
    };

    return (
        <main className="flex min-h-screen w-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Set up your organization</CardTitle>
                    <CardDescription>
                        This creates the subdomain used to access your editor workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <Field>
                            <FieldLabel>
                                <Label htmlFor="organizationName">Organization name</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="organizationName"
                                    placeholder="Acme Studios"
                                    {...register("organizationName", {
                                        required: "Organization name is required",
                                    })}
                                    onChange={(e) => {
                                        const slug = slugifyBrandName(e.target.value)
                                        setValue("domainName", slug)
                                    }}
                                />
                                <FieldError
                                    errors={[
                                        errors.organizationName && {
                                            message: errors.organizationName.message,
                                        },
                                    ]}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="domainName">Domain name</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="domainName"
                                    placeholder="example-team"
                                    {...register("domainName", {
                                        required: "Domain name is required",
                                        setValueAs: (value) =>
                                            sanitizeDomainInput(typeof value === "string" ? value : ""),
                                    })}
                                />
                                <FieldError
                                    errors={[
                                        errors.domainName && {
                                            message: errors.domainName.message,
                                        },
                                    ]}
                                />
                            </FieldContent>
                        </Field>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={createOrganizationMutation.isPending || isCheckingOrganization}
                        >
                            {createOrganizationMutation.isPending
                                ? "Creating organization..."
                                : isCheckingOrganization
                                    ? "Checking organization..."
                                    : "Create organization"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}

export default OrganizationPage;
