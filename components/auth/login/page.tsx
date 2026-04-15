"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

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

import { getHostSubdomain, useLogin } from "./hooks/use-login";
import type { LoginFormValues } from "./types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { redirectToSubdomain } from "@/lib/utils";

function LoginPage() {
    const router = useRouter()
    const loginMutation = useLogin();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await loginMutation.mutateAsync(data, {
                onError: (error) => {
                    toast.error(error?.message ?? "An Error Occurred")
                },
                onSuccess: ({ redirectPath, domain }) => {
                    const subdomain = getHostSubdomain()
                    if (subdomain) {
                        router.push(redirectPath !== "/login" ? redirectPath : "")
                    } else if (domain) {
                        redirectToSubdomain(domain, redirectPath)
                    }
                }
            });
        } catch (error: any) {
            toast.error(error?.message ?? "An Error Occured While Trying To Login")
        }
    };

    return (
        <main className="flex min-h-screen w-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <Field>
                            <FieldLabel>
                                <Label htmlFor="email">Email</Label>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Enter a valid email",
                                        },
                                    })}
                                />
                                <FieldError errors={[errors.email && { message: errors.email.message }]} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>
                                <Label htmlFor="password">Password</Label>
                            </FieldLabel>
                            <FieldContent>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={passwordVisible ? "text" : "password"}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className="pr-10"
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: {
                                                value: 6,
                                                message: "Password must be at least 6 characters",
                                            },
                                        })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setPasswordVisible((previous) => !previous)}
                                    >
                                        {passwordVisible ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <FieldError errors={[errors.password && { message: errors.password.message }]} />
                            </FieldContent>
                        </Field>

                        <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? "Signing in..." : "Sign in"}
                        </Button>

                        <p className="text-sm text-muted-foreground">
                            Need an account?{" "}
                            <Link className="text-foreground underline" href="/signup">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}

export default LoginPage;
