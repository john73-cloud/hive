'use client';

import { useCallback, useEffect, useRef } from 'react';

import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { initAdvancedEditor } from '../imgly';
import CreativeEditor from '@cesdk/cesdk-js/react';

import type { PersistedScenePayload } from '@/components/imgly/config/actions';
import type { ProjectData } from '@/components/projects/types';

type PersistResourceInput = {
    url: string;
    dataHash: string;
};

const EDITOR_CONFIG = { baseURL: '/assets' } as const;

const SAVE_ACTION_TIMEOUT_MS = 90_000;
const RESOURCE_FETCH_TIMEOUT_MS = 30_000;
const ALLOWED_RESOURCE_SCHEMES = ['http', 'https', 'data', 'blob', 'file'] as const;

type AdvancedEditorProps = {
    projectData?: ProjectData;
    onSaveProjectData?: (payload: PersistedScenePayload) => Promise<void>;
};

const isPersistedScenePayload = (value: unknown): value is PersistedScenePayload => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<PersistedScenePayload>;
    return typeof candidate.scene === 'string' && Array.isArray(candidate.assets);
};

const parseProjectPayload = (value: ProjectData | undefined): PersistedScenePayload | null => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return isPersistedScenePayload(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }

    return isPersistedScenePayload(value) ? value : null;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
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

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> =>
    new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timeoutHandle);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutHandle);
                reject(error);
            });
    });

const fetchBlobWithTimeout = async (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Failed to read resource ${url}.`);
        }

        return await response.blob();
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(`Timed out while reading resource ${url}.`);
        }

        throw error;
    } finally {
        clearTimeout(timeoutHandle);
    }
};

const applyReplacementsToScene = (scene: string, replacements: Map<string, string>) => {
    let updatedScene = scene;

    for (const [sourceUri, targetUri] of replacements.entries()) {
        updatedScene = updatedScene.split(sourceUri).join(targetUri);
    }

    return updatedScene;
};

const shouldInlineAsset = (asset: PersistedScenePayload['assets'][number]) =>
    asset.transient && (asset.scheme === 'blob' || asset.scheme === 'file');

const getPayloadDebugMeta = (payload: PersistedScenePayload) => ({
    sceneLength: payload.scene.length,
    assetCount: payload.assets.length,
    transientAssetCount: payload.assets.filter((asset) => asset.transient).length,
    dataAssetCount: payload.assets.filter((asset) => asset.scheme === 'data').length,
});

export default function AdvancedEditor({ projectData, onSaveProjectData }: AdvancedEditorProps) {
    const saveProjectDataRef = useRef(onSaveProjectData);
    const hasCapturedInitialPayloadRef = useRef(false);
    const initialPayloadRef = useRef<PersistedScenePayload | null>(null);

    if (!hasCapturedInitialPayloadRef.current) {
        initialPayloadRef.current = parseProjectPayload(projectData);
        hasCapturedInitialPayloadRef.current = true;
    }

    useEffect(() => {
        saveProjectDataRef.current = onSaveProjectData;
    }, [onSaveProjectData]);

    useEffect(() => {
        console.info('[EditorLifecycle] AdvancedEditor mounted');

        return () => {
            console.info('[EditorLifecycle] AdvancedEditor unmounted');
        };
    }, []);

    const init = useCallback(
        async (cesdk: CreativeEditorSDK) => {
            await initAdvancedEditor(cesdk);

            if (saveProjectDataRef.current) {
                cesdk.actions.register('saveScene', async () => {
                    const saveId = `save-${Date.now()}`;
                    const startedAt = Date.now();
                    const replacementByUri = new Map<string, string>();
                    const replacementByHash = new Map<string, Promise<string>>();

                    console.groupCollapsed(`[EditorSave:${saveId}] Save started`);

                    try {
                        const persistResource = async ({ url, dataHash }: PersistResourceInput) => {
                            const cacheKey = dataHash || url;
                            const existing = replacementByHash.get(cacheKey);

                            if (existing) {
                                console.debug(`[EditorSave:${saveId}] Reusing conversion cache`, {
                                    url,
                                    cacheKey,
                                });
                                return existing;
                            }

                            const converterPromise = (async () => {
                                console.debug(`[EditorSave:${saveId}] Converting resource`, {
                                    url,
                                    cacheKey,
                                });

                                const blob = await fetchBlobWithTimeout(url, RESOURCE_FETCH_TIMEOUT_MS);
                                const dataUrl = await blobToDataUrl(blob);

                                replacementByUri.set(url, dataUrl);

                                console.debug(`[EditorSave:${saveId}] Resource converted`, {
                                    url,
                                    byteSize: blob.size,
                                    dataUrlLength: dataUrl.length,
                                });

                                return dataUrl;
                            })();

                            replacementByHash.set(cacheKey, converterPromise);
                            return converterPromise;
                        };

                        console.info(`[EditorSave:${saveId}] Running saveSceneForDatabase action`, {
                            allowedResourceSchemes: ALLOWED_RESOURCE_SCHEMES,
                            timeoutMs: SAVE_ACTION_TIMEOUT_MS,
                        });

                        const payload = (await withTimeout(
                            cesdk.actions.run('saveSceneForDatabase', {
                                allowedResourceSchemes: [...ALLOWED_RESOURCE_SCHEMES],
                            }) as Promise<PersistedScenePayload>,
                            SAVE_ACTION_TIMEOUT_MS,
                            'saveSceneForDatabase'
                        )) as PersistedScenePayload;

                        console.info(`[EditorSave:${saveId}] Raw payload ready`, getPayloadDebugMeta(payload));

                        const fallbackAssets = payload.assets.filter(
                            (asset) => shouldInlineAsset(asset) && !replacementByUri.has(asset.uri)
                        );

                        console.info(`[EditorSave:${saveId}] Fallback transient assets`, {
                            count: fallbackAssets.length,
                        });

                        for (const asset of fallbackAssets) {
                            const dataUrl = await persistResource({
                                url: asset.uri,
                                dataHash: asset.uri,
                            });

                            replacementByUri.set(asset.uri, dataUrl);
                        }

                        const normalizedPayload: PersistedScenePayload = {
                            ...payload,
                            savedAt: new Date().toISOString(),
                            scene: applyReplacementsToScene(payload.scene, replacementByUri),
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

                        console.info(
                            `[EditorSave:${saveId}] Normalized payload ready`,
                            getPayloadDebugMeta(normalizedPayload)
                        );
                        console.info(`[EditorSave:${saveId}] Sending payload to backend`);

                        const saveProjectData = saveProjectDataRef.current;

                        if (!saveProjectData) {
                            throw new Error('Save handler is not available.');
                        }

                        await saveProjectData(normalizedPayload);

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
            }

            const initialPayload = initialPayloadRef.current;

            if (initialPayload) {
                console.info('[EditorSave] Loading initial project payload', getPayloadDebugMeta(initialPayload));
                await cesdk.actions.run('loadSceneFromDatabase', {
                    payload: initialPayload,
                    waitForResources: true,
                });
            } else {
                console.info('[EditorSave] No initial project payload, editor starts with a new scene');
            }
        },
        []
    );

    return (
        <CreativeEditor
            config={EDITOR_CONFIG}
            init={init}
            width="100vw"
            height="100vh"
        />
    );
}