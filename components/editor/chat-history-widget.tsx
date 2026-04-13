"use client";

import { useMemo, useState } from "react";

import { Clock3, History } from "lucide-react";

import type { ProjectSceneHistoryEntry } from "@/components/projects/types";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

type ChatHistoryWidgetProps = {
    history: ProjectSceneHistoryEntry[];
    onPreviewHistoryScene: (sceneBase64: string) => Promise<void>;
};

const formatEditedAt = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown time";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
};

export function ChatHistoryWidget({ history, onPreviewHistoryScene }: ChatHistoryWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const sortedHistory = useMemo(
        () =>
            [...history].sort((left, right) => {
                const leftTime = new Date(left.editedAt).getTime();
                const rightTime = new Date(right.editedAt).getTime();
                return rightTime - leftTime;
            }),
        [history]
    );

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    className="pointer-events-auto absolute top-4 inset-e-4 z-70 border border-white/15 bg-zinc-950/90 text-zinc-100 shadow-xl hover:bg-zinc-900"
                    variant="outline"
                >
                    <History />
                    History
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1 text-[11px] text-zinc-200">
                        {sortedHistory.length}
                    </span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-[min(480px,95vw)] border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-120"
            >
                <SheetHeader className="border-b border-white/10 pb-4">
                    <SheetTitle className="text-zinc-100">Project history</SheetTitle>
                    <SheetDescription className="text-zinc-400">
                        Review and load previously applied AI edits for this project.
                    </SheetDescription>
                </SheetHeader>

                <div className="h-[calc(100%-5.5rem)] overflow-y-auto p-4">
                    {sortedHistory.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                            No persisted history yet. Apply a preview from chat to create the first history entry.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedHistory.map((entry, index) => {
                                const entryKey = `${entry.editedAt}-${index}`;
                                const isLoading = loadingKey === entryKey;

                                return (
                                    <article
                                        key={entryKey}
                                        className="rounded-xl border border-white/10 bg-black/20 p-3"
                                    >
                                        <p className="text-sm leading-relaxed text-zinc-200">{entry.instruction}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock3 className="size-3" />
                                                {formatEditedAt(entry.editedAt)}
                                            </span>
                                            {entry.model ? (
                                                <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-zinc-400">
                                                    {entry.model}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                                                disabled={isLoading}
                                                onClick={async () => {
                                                    setLoadingKey(entryKey);

                                                    try {
                                                        await onPreviewHistoryScene(JSON.stringify(entry.data));
                                                        setIsOpen(false);
                                                    } finally {
                                                        setLoadingKey(null);
                                                    }
                                                }}
                                            >
                                                {isLoading ? "Loading..." : "Load preview"}
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
