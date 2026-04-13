import { Suspense } from "react"
import LoginPage from "@/components/auth/login/page"

export default function Page() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-screen items-center justify-center bg-muted/50 p-4">Loading...</div>}>
            <LoginPage />
        </Suspense>
    )
}
