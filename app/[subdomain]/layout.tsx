import { DomainProvider } from "@/components/domain/domain-context"

type SubdomainLayoutProps = {
    children: React.ReactNode
}

export default function SubdomainLayout({ children }: SubdomainLayoutProps) {
    return <DomainProvider>{children}</DomainProvider>
}