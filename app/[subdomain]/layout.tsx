import { SubdomainAuthGuard } from "@/components/auth/guards/subdomain-guard"
import { DomainProvider } from "@/components/domain/domain-context"

type SubdomainLayoutProps = {
    children: React.ReactNode
}

export default function SubdomainLayout({ children }: SubdomainLayoutProps) {
    return (
        <DomainProvider>
            <SubdomainAuthGuard>{children}</SubdomainAuthGuard>
        </DomainProvider>
    )
}