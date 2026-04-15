import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = ["/login", "/signup", "/organization"];

const isBypassPath = (pathname: string) =>
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

const isPublicRoute = (pathname: string) =>
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

const decodeBase64Url = (value: string) => {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return atob(padded);
};

const isBackendTokenExpired = (token: string) => {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return true;
        }

        const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: number };

        if (typeof decoded.exp !== "number") {
            return false;
        }

        const expiryTimeMs = decoded.exp * 1000;
        const nowMs = Date.now();
        return nowMs >= expiryTimeMs - 30_000;
    } catch {
        return true;
    }
};

const getSubdomainFromHost = (host: string) => {
    const [hostname] = host.toLowerCase().split(":");

    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
        return null;
    }

    if (hostname.endsWith(".localhost")) {
        const labels = hostname.replace(/\.localhost$/, "").split(".").filter(Boolean);
        const candidate = labels[0];
        return candidate && candidate !== "www" ? candidate : null;
    }

    const baseDomain = process.env.NEXT_PUBLIC_BASEURL?.toLowerCase();

    if (baseDomain) {
        if (hostname.endsWith(`.${baseDomain}`)) {
            const subdomain = hostname.replace(`.${baseDomain}`, "");
            return subdomain === "www" ? null : subdomain;
        } else if (hostname === baseDomain) {
            return null;
        }
    }

    const labels = hostname.split(".").filter(Boolean);

    if (labels.length < 3) {
        return null;
    }

    const candidate = labels[0] === "www" ? labels[1] : labels[0];
    return candidate || null;
};

export const proxy = async (request: NextRequest) => {
    const { nextUrl } = request;
    const pathname = nextUrl.pathname;

    if (isBypassPath(pathname)) {
        return NextResponse.next();
    }

    const host = request.headers.get("host") ?? "";
    const subdomain = getSubdomainFromHost(host);

    if (!subdomain) {
        return NextResponse.next();
    }
    if (isPublicRoute(pathname) && pathname.startsWith("/organization")) {
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
    }
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });


    const sessionToken = token && typeof token.accessToken === "string" ? token.accessToken : null;
    const isAuthenticated =
        typeof sessionToken === "string" && !isBackendTokenExpired(sessionToken);
    if (!isAuthenticated) {
        const loginUrl = nextUrl.clone();
        loginUrl.pathname = "/login";
        const nextPath = `${pathname}${nextUrl.search}`;
        loginUrl.searchParams.set("next", nextPath || "/");
        return NextResponse.redirect(loginUrl);
    }

    const url = nextUrl.clone();
    url.pathname = "/" + subdomain + pathname;
    return NextResponse.rewrite(url);
};

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};