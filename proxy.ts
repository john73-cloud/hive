import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const proxy = async (request: NextRequest) => {
    const { nextUrl } = request
    const pathname = nextUrl.pathname
    const domain = process.env.DOMAIN
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }
    const subdomain = request.headers.get("host")?.split(`.${domain}`)[0]
    const url = nextUrl.clone()
    url.pathname = `/${subdomain}${pathname}`
    return NextResponse.rewrite(url)
}