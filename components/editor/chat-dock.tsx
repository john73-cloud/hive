"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useChat } from "@ai-sdk/react";
import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { Clock3, History, Loader2, SendHorizontal } from "lucide-react";

import {
    getProjectSceneBase64,
    useApplySceneEdit,
    usePreviewSceneEdit,
} from "@/components/projects/hooks/scene-ai";
import type { Project, ProjectSceneHistoryEntry } from "@/components/projects/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type EditorChatDockProps = {
    brandId: number;
    projectId: number;
    history: ProjectSceneHistoryEntry[];
    onPreviewScene: (sceneBase64: string) => Promise<void>;
    onPreviewHistoryScene: (sceneBase64: string) => Promise<void>;
    onProjectApplied: (project: Project) => void;
};

type PreviewDraft = {
    instruction: string;
    scene: string;
};

const createAssistantStream = (text: string): ReadableStream<UIMessageChunk> =>
    new ReadableStream<UIMessageChunk>({
        start(controller) {
            const streamId = `text-${Date.now()}`;

            controller.enqueue({ type: "start" });
            controller.enqueue({ type: "text-start", id: streamId });
            controller.enqueue({ type: "text-delta", id: streamId, delta: text });
            controller.enqueue({ type: "text-end", id: streamId });
            controller.enqueue({ type: "finish", finishReason: "stop" });
            controller.close();
        },
    });

const readMessageText = (message: UIMessage) => {
    const fallback = (message as { content?: unknown }).content;
    const parts = (message as { parts?: Array<Record<string, unknown>> }).parts;

    if (Array.isArray(parts)) {
        const text = parts
            .map((part) => {
                if (!part || typeof part !== "object") {
                    return "";
                }

                if (typeof part.text === "string") {
                    return part.text;
                }

                if (typeof part.delta === "string") {
                    return part.delta;
                }

                return "";
            })
            .join("")
            .trim();

        if (text.length > 0) {
            return text;
        }
    }

    return typeof fallback === "string" ? fallback : "";
};

const extractLatestInstruction = (messages: UIMessage[]) => {
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
    return latestUserMessage ? readMessageText(latestUserMessage).trim() : "";
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

export function EditorChatDock({
    brandId,
    projectId,
    history,
    onPreviewScene,
    onPreviewHistoryScene,
    onProjectApplied,
}: EditorChatDockProps) {
    const [input, setInput] = useState("");
    const [latestDraft, setLatestDraft] = useState<PreviewDraft | null>(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
    const [historyLoadingKey, setHistoryLoadingKey] = useState<string | null>(null);

    const previewSceneEdit = usePreviewSceneEdit(brandId, projectId);
    const applySceneEdit = useApplySceneEdit(brandId, projectId);

    const previewSceneRef = useRef(onPreviewScene);
    const onProjectAppliedRef = useRef(onProjectApplied);
    const previewMutationRef = useRef(previewSceneEdit.mutateAsync);
    const applyMutationRef = useRef(applySceneEdit.mutateAsync);

    useEffect(() => {
        previewSceneRef.current = onPreviewScene;
    }, [onPreviewScene]);

    useEffect(() => {
        onProjectAppliedRef.current = onProjectApplied;
    }, [onProjectApplied]);

    useEffect(() => {
        previewMutationRef.current = previewSceneEdit.mutateAsync;
    }, [previewSceneEdit.mutateAsync]);

    useEffect(() => {
        applyMutationRef.current = applySceneEdit.mutateAsync;
    }, [applySceneEdit.mutateAsync]);

    const transport = useMemo<ChatTransport<UIMessage>>(
        () => ({
            sendMessages: async ({ messages }) => {
                const instruction = extractLatestInstruction(messages);

                if (!instruction) {
                    return createAssistantStream("Add an instruction first so I can generate a scene preview.");
                }

                try {
                    const previewProject = await previewMutationRef.current({ instruction });
                    const previewScene = getProjectSceneBase64(previewProject);

                    if (!previewScene) {
                        return createAssistantStream(
                            "Preview finished, but the backend response did not include a scene payload."
                        );
                    }

                    await previewSceneRef.current(previewScene);
                    setLatestDraft({ instruction, scene: previewScene });

                    return createAssistantStream(
                        "Preview loaded in the canvas. If it looks good, click Apply to persist it."
                    );
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : "Something went wrong while generating preview.";

                    return createAssistantStream(`Preview failed: ${message}`);
                }
            },
            reconnectToStream: async () => null,
        }),
        []
    );

    const { sendMessage, status, error } = useChat({
        id: `project-scene-chat-${projectId}`,
        transport,
    });

    const isSending = status === "submitted" || status === "streaming";

    const sortedHistory = useMemo(
        () =>
            [...history].sort((left, right) => {
                const leftTime = new Date(left.editedAt).getTime();
                const rightTime = new Date(right.editedAt).getTime();
                return rightTime - leftTime;
            }),
        [history]
    );

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const trimmed = input.trim();

            if (!trimmed || isSending) {
                return;
            }

            setInput("");
            await sendMessage({ text: trimmed });
        },
        [input, isSending, sendMessage]
    );

    const handleApply = useCallback(async () => {
        if (!latestDraft || isSending || applySceneEdit.isPending) {
            return;
        }

        try {
            const appliedProject = await applyMutationRef.current({
                instruction: latestDraft.instruction,
                data: JSON.parse(latestDraft.scene),
            });

            const appliedScene = getProjectSceneBase64(appliedProject);

            if (appliedScene) {
                await previewSceneRef.current(appliedScene);
                setLatestDraft((current) =>
                    current
                        ? {
                            ...current,
                            scene: appliedScene,
                        }
                        : current
                );
            }

            onProjectAppliedRef.current(appliedProject);
        } catch {
            // Toast is already emitted by scene-ai hook.
        }
    }, [applySceneEdit.isPending, isSending, latestDraft]);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="pointer-events-auto fixed inset-s-4 top-1/2 z-70 -translate-y-1/2 border border-white/15 bg-zinc-950/90 text-zinc-100 shadow-xl hover:bg-zinc-900"
                onClick={() => setIsHistoryExpanded((current) => !current)}
            >
                <History className="size-4" />
                History
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1 text-[11px] text-zinc-200">
                    {sortedHistory.length}
                </span>
            </Button>

            <section className="pointer-events-auto absolute inset-e-4 top-4 bottom-4 z-65 flex w-[min(420px,calc(100%-4.5rem))] flex-col rounded-xl border border-white/10 bg-zinc-950/88 p-3 shadow-2xl backdrop-blur-md">
                <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Describe the next scene change..."
                            className="min-h-20 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
                            disabled={isSending}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="max-w-[65%] truncate text-[11px] text-zinc-500">
                                {latestDraft
                                    ? `Draft ready: ${latestDraft.instruction}`
                                    : "Send an instruction to generate a draft."}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                    className="border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                                    disabled={!latestDraft || isSending || applySceneEdit.isPending}
                                    onClick={handleApply}
                                >
                                    {applySceneEdit.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Applying
                                        </>
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    type="submit"
                                    disabled={!input.trim() || isSending}
                                    className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Previewing
                                        </>
                                    ) : (
                                        <>
                                            <SendHorizontal />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {error ? <p className="mt-2 text-xs text-red-300">{error.message}</p> : null}
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-black/20 p-2.5">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">History</p>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                            onClick={() => setIsHistoryExpanded((current) => !current)}
                        >
                            {isHistoryExpanded ? "Collapse" : "Expand"}
                        </Button>
                    </div>

                    {!isHistoryExpanded ? (
                        <p className="text-xs text-zinc-500">History collapsed.</p>
                    ) : sortedHistory.length === 0 ? (
                        <div className="rounded-md border border-white/10 bg-black/30 p-3 text-xs text-zinc-400">
                            No persisted history yet. Apply a preview to create the first history entry.
                        </div>
                    ) : (
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                            {sortedHistory.map((entry, index) => {
                                const entryKey = `${entry.editedAt}-${index}`;
                                const isHistoryLoading = historyLoadingKey === entryKey;

                                return (
                                    <article
                                        key={entryKey}
                                        className="rounded-md border border-white/10 bg-black/30 p-2"
                                    >
                                        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-200">
                                            {entry.instruction}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
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
                                        <div className="mt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 border-white/15 bg-white/5 px-2 text-[11px] text-zinc-200 hover:bg-white/10"
                                                disabled={isHistoryLoading}
                                                onClick={async () => {
                                                    setHistoryLoadingKey(entryKey);

                                                    try {
                                                        await onPreviewHistoryScene(JSON.stringify(entry.data));
                                                    } finally {
                                                        setHistoryLoadingKey(null);
                                                    }
                                                }}
                                            >
                                                {isHistoryLoading ? "Loading..." : "Load preview"}
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
