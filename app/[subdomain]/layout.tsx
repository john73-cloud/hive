import { BrandsContext } from "@/components/brands/components/context"
import { BrandWorkspaceSidebar } from "@/components/brands/components/sidebar"
import { SubdomainAuthGuard } from "@/components/auth/guards/subdomain-guard"
import { DomainProvider } from "@/components/domain/domain-context"

type SubdomainLayoutProps = {
    children: React.ReactNode
}

export default function SubdomainLayout({ children }: SubdomainLayoutProps) {
    return (
        <DomainProvider>
            <SubdomainAuthGuard>
                <BrandsContext>
                    <BrandWorkspaceSidebar>
                        {children}
                    </BrandWorkspaceSidebar>
                </BrandsContext>
            </SubdomainAuthGuard>
        </DomainProvider>
    )
}