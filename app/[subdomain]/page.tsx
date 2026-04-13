import Link from "next/link";
import { ArrowRight, Palette, PenLine, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const AGENT_CARDS = [
    {
        id: "graphics",
        title: "Graphics Agent",
        description: "Design visuals, iterate scenes, and manage production-ready project assets.",
        href: "/graphics",
        available: true,
        icon: Palette,
    },
    {
        id: "branding",
        title: "Brand Strategy Agent",
        description: "Define positioning systems, naming, and strategic brand decisions.",
        href: "/branding",
        available: false,
        icon: Sparkles,
    },
    {
        id: "copywriting",
        title: "Copywriting Agent",
        description: "Generate campaign copy, scripts, and brand-consistent messaging.",
        href: "/copywriting",
        available: false,
        icon: PenLine,
    },
] as const;

export default function SubdomainHomePage() {
    return (
        <main className="min-h-svh bg-[radial-gradient(70rem_35rem_at_0%_0%,rgba(56,189,248,0.12),transparent),linear-gradient(180deg,#090b10_0%,#05060a_100%)] px-5 py-10 text-zinc-100 sm:px-8 lg:px-12 lg:py-14">
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <header className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Agent workspace</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
                        Choose your active agent
                    </h1>
                    <p className="mt-3 text-sm text-zinc-400">
                        Each agent runs as its own workspace surface. Start in Graphics today, then expand into
                        branding and copywriting as those teams come online.
                    </p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {AGENT_CARDS.map((agent) => {
                        const Icon = agent.icon;

                        return (
                            <Card
                                key={agent.id}
                                className="border border-white/10 bg-[linear-gradient(180deg,rgba(17,21,30,0.86),rgba(10,12,18,0.94))] text-zinc-100 ring-0"
                            >
                                <CardHeader>
                                    <div className="mb-2 inline-flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200">
                                        <Icon className="size-4" />
                                    </div>
                                    <CardTitle className="text-base text-zinc-100">{agent.title}</CardTitle>
                                    <CardDescription className="text-sm text-zinc-400">
                                        {agent.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {agent.available ? (
                                        <Badge variant="secondary" className="bg-emerald-400/15 text-emerald-200">
                                            Available
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-white/15 text-zinc-400">
                                            Coming soon
                                        </Badge>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {agent.available ? (
                                        <Button asChild className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                                            <Link href={agent.href}>
                                                Open workspace
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled className="w-full border-white/15 text-zinc-400">
                                            Not available yet
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
