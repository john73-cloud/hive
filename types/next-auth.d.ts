import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            token: string;
            domain: string | null;
        };
    }

    interface User {
        id: string;
        token: string;
        domain: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        accessToken?: string;
        domain?: string | null;
    }
}
