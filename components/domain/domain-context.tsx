"use client"

import React, { useContext, createContext } from "react"
import { useParams } from "next/navigation"

type DomainContextValue = {
    subdomain: string | null
}

const DomainContext = createContext<DomainContextValue | undefined>(undefined)

function DomainProvider({ children }: React.PropsWithChildren) {
    const { subdomain = "" } = useParams<{ subdomain?: string }>()


    return (
        <DomainContext.Provider value={{ subdomain }}>{children}</DomainContext.Provider>
    )
}

function useSubdomain() {
    const context = useContext(DomainContext)

    if (!context) {
        throw new Error("useDomain must be used within a DomainProvider")
    }

    return context.subdomain
}


export { DomainProvider, useSubdomain }
