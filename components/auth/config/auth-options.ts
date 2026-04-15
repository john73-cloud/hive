import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type LoginResponse = {
    user: {
        id: number;
        name: string;
        email: string;
    };
    token: string;
};

type UserOrganizationResponse = {
    id: number;
    name: string;
    domain: {
        id: number;
        name: string;
    };
};

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim();
                const password = credentials?.password;

                if (!email || !password) {
                    return null;
                }

                const apiBaseUrl =
                    process.env.API_BASE_URL ??
                    process.env.NEXT_PUBLIC_API_BASE_URL ??
                    "http://localhost:5000";

                const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                    cache: "no-store",
                });

                if (!loginResponse.ok) {
                    return null;
                }

                const loginPayload = (await loginResponse.json()) as LoginResponse;

                const organizationResponse = await fetch(
                    `${apiBaseUrl}/auth/user/${loginPayload.user.id}/organization`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${loginPayload.token}`,
                        },
                        cache: "no-store",
                    }
                );

                let domain: string | null = null;
                if (organizationResponse.ok) {
                    const organizationPayload =
                        (await organizationResponse.json()) as UserOrganizationResponse;
                    domain = organizationPayload.domain.name;
                }
                return {
                    id: String(loginPayload.user.id),
                    name: loginPayload.user.name,
                    email: loginPayload.user.email,
                    token: loginPayload.token,
                    domain,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.accessToken = user.token;
                token.domain = user.domain;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = typeof token.id === "string" ? token.id : "";
                session.user.token =
                    typeof token.accessToken === "string" ? token.accessToken : "";
                session.user.domain =
                    typeof token.domain === "string" ? token.domain : null;
            }
            return session;
        },
    },
};
