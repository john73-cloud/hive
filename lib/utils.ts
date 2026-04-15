import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const redirectToSubdomain = (subdomain: string, pathname: string) => {

  const baseDomain = process.env.NEXT_PUBLIC_BASEURL ?? "localhost:3000"
  const host = `${subdomain}.${baseDomain}`
  const protocool = location.hostname === "localhost" ? "http://" : "https://"
  window.location.replace(`${protocool}${host}${pathname}`)
}

export const slugifyBrandName = (name: string): string => {
  const slugBase = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const trimmed = slugBase.slice(0, 120).replace(/-+$/g, "");

  return trimmed
};