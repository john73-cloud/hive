import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  applyProjectSceneEdit,
  getProjectSceneData,
  getProjectSceneHistory,
  previewProjectSceneEdit
} from '@/components/projects/hooks/scene-ai';
import type { Project, ProjectSceneData, ProjectSceneHistoryEntry } from '@/components/projects/types';

export const SCENE_CHAT_DOCK_COMPONENT_ID = 'hive.sceneChat.dock';
const SCENE_CHAT_PANEL_ID = 'hive.sceneChat.panel';

type SceneAiDockContext = {
  brandId: number | null;
  projectId: number | null;
  initialHistory: ProjectSceneHistoryEntry[];
  onProjectApplied?: (project: Project) => Promise<void> | void;
};

type ScenePreviewDraft = {
  instruction: string;
  data: ProjectSceneData;
};

let sceneAiDockContext: SceneAiDockContext = {
  brandId: null,
  projectId: null,
  initialHistory: []
};

export function setSceneAiDockContext(context: SceneAiDockContext): void {
  sceneAiDockContext = context;
}

const readSceneSerialization = (data: ProjectSceneData): string => {
  const sceneValue = data.scene;

  if (typeof sceneValue !== 'string') {
    throw new Error('Scene payload did not include a string scene serialization.');
  }

  const sceneSerialization = sceneValue.trim();

  if (sceneSerialization.length === 0) {
    throw new Error('Scene payload did not include a usable scene serialization.');
  }

  return sceneSerialization;
};

const loadSceneSerialization = async (cesdk: CreativeEditorSDK, sceneSerialization: string) => {
  await cesdk.engine.scene.loadFromString(sceneSerialization, false, true);
  await cesdk.actions.run('zoom.toPage', { page: 'first' });
};

const formatEditedAt = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export function setupComponents(cesdk: CreativeEditorSDK): void {
  cesdk.ui.registerComponent(SCENE_CHAT_DOCK_COMPONENT_ID, ({ builder }) => {
    builder.Button('hive.sceneChat.dock.button', {
      label: 'History',
      tooltip: 'Scene history and AI chat',
      icon: '@imgly/Library',
      isSelected: cesdk.ui.isPanelOpen(SCENE_CHAT_PANEL_ID),
      onClick: () => {
        if (cesdk.ui.isPanelOpen(SCENE_CHAT_PANEL_ID)) {
          cesdk.ui.closePanel(SCENE_CHAT_PANEL_ID);
          return;
        }

        cesdk.ui.openPanel(SCENE_CHAT_PANEL_ID, {
          position: 'left',
          floating: false
        });
      }
    });
  });

  cesdk.ui.registerPanel(SCENE_CHAT_PANEL_ID, ({ builder, state }) => {
    const instructionState = state<string>('scene-chat.instruction', '');
    const statusState = state<string>('scene-chat.status', 'Type an instruction and click Send.');
    const previewDraftState = state<ScenePreviewDraft | null>('scene-chat.previewDraft', null);
    const revertSceneState = state<string>('scene-chat.revertScene', '');
    const isSendingState = state<boolean>('scene-chat.isSending', false);
    const isPreviewingState = state<boolean>('scene-chat.isPreviewing', false);
    const isApplyingState = state<boolean>('scene-chat.isApplying', false);
    const historyLoadingIdState = state<string | null>('scene-chat.historyLoadingId', null);
    const historyState = state<ProjectSceneHistoryEntry[]>('scene-chat.history', sceneAiDockContext.initialHistory);

    if (historyState.value.length === 0 && sceneAiDockContext.initialHistory.length > 0) {
      historyState.setValue(sceneAiDockContext.initialHistory);
    }

    const brandId = sceneAiDockContext.brandId;
    const projectId = sceneAiDockContext.projectId;
    const trimmedInstruction = instructionState.value.trim();
    const hasPreviewDraft = previewDraftState.value !== null;

    builder.Section('scene-chat-history', {
      title: 'History',
      scrollable: true,
      children: () => {
        if (historyState.value.length === 0) {
          builder.Text('scene-chat-history-empty', {
            content: 'No persisted history yet.'
          });
          return;
        }

        historyState.value.forEach((entry, index) => {
          const entryId = `${entry.editedAt}-${index}`;

          builder.Section(`scene-chat-history-entry-${entryId}`, {
            children: () => {
              builder.Text(`scene-chat-history-instruction-${entryId}`, {
                content: entry.instruction
              });

              builder.Text(`scene-chat-history-meta-${entryId}`, {
                content: `${formatEditedAt(entry.editedAt)}${entry.model ? ` | ${entry.model}` : ''}`
              });

              builder.Button(`scene-chat-history-load-${entryId}`, {
                label: historyLoadingIdState.value === entryId ? 'Loading...' : 'Load preview',
                isDisabled:
                  historyLoadingIdState.value === entryId ||
                  isSendingState.value ||
                  isPreviewingState.value ||
                  isApplyingState.value,
                onClick: async () => {
                  if (
                    historyLoadingIdState.value === entryId ||
                    isSendingState.value ||
                    isPreviewingState.value ||
                    isApplyingState.value
                  ) {
                    return;
                  }

                  historyLoadingIdState.setValue(entryId);

                  try {
                    const sceneToLoad = readSceneSerialization(entry.data);
                    await loadSceneSerialization(cesdk, sceneToLoad);
                    previewDraftState.setValue(null);
                    revertSceneState.setValue('');
                    statusState.setValue('Loaded history preview.');
                  } catch (error) {
                    statusState.setValue(
                      `History preview failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`
                    );
                  } finally {
                    historyLoadingIdState.setValue(null);
                  }
                }
              });
            }
          });
        });
      }
    });

    builder.Separator('scene-chat-controls-separator');

    builder.Section('scene-chat-controls', {
      title: 'AI chat',
      children: () => {
        builder.TextArea('scene-chat-panel-input', {
          inputLabel: 'Instruction',
          value: instructionState.value,
          setValue: instructionState.setValue,
          isDisabled: isSendingState.value || isPreviewingState.value || isApplyingState.value,
          placeholder: 'Describe the next scene change...'
        });

        builder.ButtonGroup('scene-chat-panel-actions', {
          children: () => {
            if (hasPreviewDraft) {
              builder.Button('scene-chat-panel-apply-button', {
                label: isApplyingState.value ? 'Applying...' : 'Apply',
                color: 'accent',
                isDisabled:
                  !brandId ||
                  !projectId ||
                  previewDraftState.value === null ||
                  isSendingState.value ||
                  isPreviewingState.value ||
                  isApplyingState.value,
                onClick: async () => {
                  if (
                    !brandId ||
                    !projectId ||
                    previewDraftState.value === null ||
                    isSendingState.value ||
                    isPreviewingState.value ||
                    isApplyingState.value
                  ) {
                    return;
                  }

                  isApplyingState.setValue(true);
                  statusState.setValue('Applying draft...');

                  try {
                    const previewDraft = previewDraftState.value;

                    if (!previewDraft) {
                      throw new Error('Draft payload is not available.');
                    }

                    const appliedProject = await applyProjectSceneEdit({
                      brandId,
                      projectId,
                      instruction: previewDraft.instruction,
                      data: previewDraft.data
                    });

                    const appliedData = getProjectSceneData(appliedProject);

                    if (!appliedData) {
                      throw new Error('Persisted response did not include a scene payload.');
                    }

                    const appliedScene = readSceneSerialization(appliedData);

                    await loadSceneSerialization(cesdk, appliedScene);

                    previewDraftState.setValue(null);
                    revertSceneState.setValue('');

                    const nextHistory = getProjectSceneHistory(appliedProject);
                    historyState.setValue(nextHistory);
                    sceneAiDockContext = {
                      ...sceneAiDockContext,
                      initialHistory: nextHistory
                    };

                    const onProjectApplied = sceneAiDockContext.onProjectApplied;
                    if (onProjectApplied) {
                      await onProjectApplied(appliedProject);
                    }

                    statusState.setValue('Changes applied and saved.');
                  } catch (error) {
                    statusState.setValue(
                      `Apply failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`
                    );
                  } finally {
                    isApplyingState.setValue(false);
                  }
                }
              });
            }

            builder.Button('scene-chat-panel-preview-button', {
              label: isSendingState.value ? 'Sending...' : 'Send',
              color: 'accent',
              isDisabled:
                !brandId ||
                !projectId ||
                trimmedInstruction.length === 0 ||
                isSendingState.value ||
                isPreviewingState.value ||
                isApplyingState.value,
              onClick: async () => {
                if (
                  !brandId ||
                  !projectId ||
                  trimmedInstruction.length === 0 ||
                  isSendingState.value ||
                  isPreviewingState.value ||
                  isApplyingState.value
                ) {
                  return;
                }

                isSendingState.setValue(true);
                statusState.setValue('Generating draft...');

                try {
                  const previewProject = await previewProjectSceneEdit({
                    brandId,
                    projectId,
                    instruction: trimmedInstruction
                  });

                  const previewData = getProjectSceneData(previewProject);

                  if (!previewData) {
                    throw new Error('Backend response did not include a scene payload.');
                  }

                  const previewScene = readSceneSerialization(previewData);

                  const sceneBeforePreview = await cesdk.engine.scene.saveToString();

                  isPreviewingState.setValue(true);
                  statusState.setValue('Loading draft preview...');
                  await loadSceneSerialization(cesdk, previewScene);

                  previewDraftState.setValue({
                    instruction: trimmedInstruction,
                    data: previewData
                  });
                  revertSceneState.setValue(sceneBeforePreview);
                  statusState.setValue('Draft loaded. Click Apply to persist or Revert to discard.');

                  const nextHistory = getProjectSceneHistory(previewProject);
                  historyState.setValue(nextHistory);
                  sceneAiDockContext = {
                    ...sceneAiDockContext,
                    initialHistory: nextHistory
                  };
                } catch (error) {
                  statusState.setValue(
                    `Send failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`
                  );
                } finally {
                  isPreviewingState.setValue(false);
                  isSendingState.setValue(false);
                }
              }
            });

            if (hasPreviewDraft) {
              builder.Button('scene-chat-panel-revert-button', {
                label: isPreviewingState.value ? 'Reverting...' : 'Revert',
                isDisabled:
                  revertSceneState.value.length === 0 ||
                  isSendingState.value ||
                  isPreviewingState.value ||
                  isApplyingState.value,
                onClick: async () => {
                  if (
                    revertSceneState.value.length === 0 ||
                    isSendingState.value ||
                    isPreviewingState.value ||
                    isApplyingState.value
                  ) {
                    return;
                  }

                  isPreviewingState.setValue(true);
                  statusState.setValue('Reverting preview...');

                  try {
                    await loadSceneSerialization(cesdk, revertSceneState.value);
                    previewDraftState.setValue(null);
                    revertSceneState.setValue('');
                    statusState.setValue('Preview reverted.');
                  } catch (error) {
                    statusState.setValue(
                      `Revert failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`
                    );
                  } finally {
                    isPreviewingState.setValue(false);
                  }
                }
              });
            }
          }
        });

        builder.Text('scene-chat-panel-status', {
          content: statusState.value
        });
      }
    });
  });

  cesdk.ui.setPanelPosition(SCENE_CHAT_PANEL_ID, 'left');
  cesdk.ui.setPanelFloating(SCENE_CHAT_PANEL_ID, false);
  cesdk.ui.openPanel(SCENE_CHAT_PANEL_ID, {
    position: 'left',
    floating: false
  });
}
