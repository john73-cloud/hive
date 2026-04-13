'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import type CreativeEditorSDK from '@cesdk/cesdk-js';
import CreativeEditor from '@cesdk/cesdk-js/react';
import { initAdvancedEditor } from '../imgly';

import type { PersistedScenePayload } from '@/components/imgly/config/actions';
import { setSceneAiDockContext } from '@/components/imgly/config/ui/components';
import { getProjectSceneHistory } from '@/components/projects/hooks/scene-ai';
import type { Project } from '@/components/projects/types';

const EDITOR_CONFIG = { baseURL: '/assets' } as const;

const SAVE_ACTION_TIMEOUT_MS = 90_000;
const RESOURCE_FETCH_TIMEOUT_MS = 30_000;
const ALLOWED_RESOURCE_SCHEMES = ['http', 'https', 'data', 'blob', 'file'] as const;

type AdvancedEditorProps = {
    project?: {
        brandId?: number | null;
        id: number;
        data: unknown;
        history?: unknown;
    };
    onSaveProjectData?: (payload: PersistedScenePayload) => Promise<void> | void;
    onProjectApplied?: (project: Project) => Promise<void> | void;
    onNavigateBack?: () => void;
};

const parsePersistedScenePayload = (rawProjectData: unknown): PersistedScenePayload | null => {
    if (typeof rawProjectData === 'string') {
        try {
            const parsed = JSON.parse(rawProjectData) as unknown;
            if (
                parsed &&
                typeof parsed === 'object' &&
                typeof (parsed as PersistedScenePayload).scene === 'string' &&
                Array.isArray((parsed as PersistedScenePayload).assets)
            ) {
                return parsed as PersistedScenePayload;
            }
        } catch {
            return null;
        }

        return null;
    }

    if (
        rawProjectData &&
        typeof rawProjectData === 'object' &&
        typeof (rawProjectData as PersistedScenePayload).scene === 'string' &&
        Array.isArray((rawProjectData as PersistedScenePayload).assets)
    ) {
        return rawProjectData as PersistedScenePayload;
    }

    return null;
};

export default function AdvancedEditor({
    project,
    onSaveProjectData,
    onProjectApplied,
    onNavigateBack,
}: AdvancedEditorProps) {
    const initialPayload = useMemo(
        () => parsePersistedScenePayload(project?.data),
        [project?.data]
    );

    const initialPayloadRef = useRef(initialPayload);
    const initialBrandIdRef = useRef(project?.brandId ?? null);
    const initialProjectIdRef = useRef(project?.id ?? null);
    const initialHistoryRef = useRef(getProjectSceneHistory(project));
    const onSaveProjectDataRef = useRef(onSaveProjectData);
    const onProjectAppliedRef = useRef(onProjectApplied);
    const onNavigateBackRef = useRef(onNavigateBack);

    useEffect(() => {
        onSaveProjectDataRef.current = onSaveProjectData;
    }, [onSaveProjectData]);

    useEffect(() => {
        onProjectAppliedRef.current = onProjectApplied;
    }, [onProjectApplied]);

    useEffect(() => {
        onNavigateBackRef.current = onNavigateBack;
    }, [onNavigateBack]);

    const init = useCallback(
        async (cesdk: CreativeEditorSDK) => {
            setSceneAiDockContext({
                brandId: initialBrandIdRef.current,
                projectId: initialProjectIdRef.current,
                initialHistory: initialHistoryRef.current,
                onProjectApplied: async (nextProject) => {
                    const applyHandler = onProjectAppliedRef.current;

                    if (applyHandler) {
                        await applyHandler(nextProject);
                    }
                },
            });

            await initAdvancedEditor(cesdk);

            if (onNavigateBackRef.current) {
                cesdk.ui.removeOrderComponent({ in: 'ly.img.navigation.bar', match: 'ly.img.back.navigationBar' });

                cesdk.ui.insertOrderComponent(
                    { in: 'ly.img.navigation.bar', before: 'ly.img.undoRedo.navigationBar' },
                    {
                        id: 'ly.img.back.navigationBar',
                        onClick: () => {
                            const navigateBackHandler = onNavigateBackRef.current;

                            if (navigateBackHandler) {
                                navigateBackHandler();
                                return;
                            }

                            window.history.back();
                        },
                    }
                );
            }

            cesdk.actions.register('saveScene', async () => {
                const saveHandler = onSaveProjectDataRef.current;

                if (!saveHandler) {
                    return;
                }

                const saveId = `save-${Date.now()}`;
                const startedAt = Date.now();
                const replacementByUri = new Map<string, string>();

                try {
                    const saveScenePromise = cesdk.actions.run('saveSceneForDatabase', {
                        allowedResourceSchemes: [...ALLOWED_RESOURCE_SCHEMES],
                    }) as Promise<PersistedScenePayload>;

                    const payload = (await Promise.race([
                        saveScenePromise,
                        new Promise<never>((_, reject) => {
                            setTimeout(
                                () => reject(new Error(`saveSceneForDatabase timed out after ${SAVE_ACTION_TIMEOUT_MS}ms`)),
                                SAVE_ACTION_TIMEOUT_MS
                            );
                        }),
                    ])) as PersistedScenePayload;

                    for (const asset of payload.assets) {
                        if (!asset.transient || (asset.scheme !== 'blob' && asset.scheme !== 'file')) {
                            continue;
                        }

                        if (replacementByUri.has(asset.uri)) {
                            continue;
                        }

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), RESOURCE_FETCH_TIMEOUT_MS);

                        try {
                            const response = await fetch(asset.uri, { signal: controller.signal });

                            if (!response.ok) {
                                throw new Error(`Failed to read resource ${asset.uri}.`);
                            }

                            const blob = await response.blob();
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();

                                reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                        resolve(reader.result);
                                        return;
                                    }

                                    reject(new Error('Unable to serialize blob resource.'));
                                };

                                reader.onerror = () => reject(new Error('Failed to read blob resource.'));
                                reader.readAsDataURL(blob);
                            });

                            replacementByUri.set(asset.uri, dataUrl);
                        } catch (error) {
                            if (error instanceof DOMException && error.name === 'AbortError') {
                                throw new Error(`Timed out while reading resource ${asset.uri}.`);
                            }

                            throw error;
                        } finally {
                            clearTimeout(timeoutId);
                        }
                    }

                    let scene = payload.scene;
                    for (const [sourceUri, targetUri] of replacementByUri.entries()) {
                        scene = scene.split(sourceUri).join(targetUri);
                    }

                    const normalizedPayload: PersistedScenePayload = {
                        ...payload,
                        savedAt: new Date().toISOString(),
                        scene,
                        assets: payload.assets.map((asset) => {
                            const replacementUri = replacementByUri.get(asset.uri);

                            if (!replacementUri) {
                                return asset;
                            }

                            return {
                                uri: replacementUri,
                                scheme: 'data',
                                transient: false,
                            };
                        }),
                    };

                    await saveHandler(normalizedPayload);

                    console.info(`[EditorSave:${saveId}] Save finished`, {
                        durationMs: Date.now() - startedAt,
                    });
                } catch (error) {
                    console.error(`[EditorSave:${saveId}] Save failed`, error);
                    throw error;
                } finally {
                    console.groupEnd();
                }
            });

            const payloadToLoad = initialPayloadRef.current;

            if (payloadToLoad) {
                await cesdk.actions.run('loadSceneFromDatabase', {
                    payload: payloadToLoad,
                    waitForResources: true,
                });
            }
        },
        []
    );

    return (
        <div className="relative h-svh w-screen overflow-hidden">
            <CreativeEditor
                config={EDITOR_CONFIG}
                init={init}
                width="100vw"
                height="100vh"
            />
        </div>
    );
}