/**
 * Actions Configuration - Override Default Actions and Add Custom Actions
 *
 * This file shows how to override CE.SDK's default actions with your own
 * implementations, and how to register custom actions for the Advanced Editor.
 *
 * ## Actions API
 *
 * Actions provide a way to extend or replace the editor's default behaviors:
 *
 * - `cesdk.actions.register(id, handler)` - Register or override an action
 * - `cesdk.actions.run(id, ...args)` - Execute an action (async, throws if not found)
 * - `cesdk.actions.get(id)` - Get action handler (returns undefined if not found)
 * - `cesdk.actions.list()` - List all registered action IDs
 *
 * ## Built-in Utility Functions
 *
 * CE.SDK provides utilities for common operations that you can use in your actions:
 *
 * - `cesdk.utils.export(options)` - Export current design to various formats
 *   - Options: mimeType, targetWidth, targetHeight, jpegQuality, pngCompressionLevel
 *   - Returns: { blobs: Blob[], options: ExportOptions }
 *
 * - `cesdk.utils.downloadFile(data, mimeType, filename?)` - Trigger browser file download
 *   - data: Blob, string, or ArrayBuffer
 *   - mimeType: MIME type (e.g., 'image/png', 'application/json')
 *   - filename: Optional filename (auto-generated if not provided)
 *
 * - `cesdk.utils.loadFile(options)` - Open browser file picker
 *   - Options: accept (file extensions), returnType ('text', 'arrayBuffer', 'objectURL')
 *   - Returns: Promise<string | ArrayBuffer | string> based on returnType
 *
 * - `cesdk.utils.localUpload(file, context)` - Create local blob URL for uploads
 *   - file: File object from input or drag-drop
 *   - context: Upload context ('image', 'video', 'audio', etc.)
 *   - Returns: Promise<string> - Blob URL that can be used with engine
 *
 * @see https://img.ly/docs/cesdk/js/actions-6ch24x
 * @see https://img.ly/docs/cesdk/js/export/
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

type PersistResourceFn = (resource: { url: string; dataHash: string }) => Promise<string>;

export interface PersistedAssetReference {
  uri: string;
  scheme: string;
  transient: boolean;
  size?: number;
}

export interface PersistedScenePayload {
  version: 1;
  savedAt: string;
  scene: string;
  assets: PersistedAssetReference[];
}

export interface SaveSceneForDatabaseOptions {
  persistResource?: PersistResourceFn;
  allowedResourceSchemes?: string[];
}

export interface LoadSceneFromDatabaseOptions {
  payload: PersistedScenePayload | string;
  waitForResources?: boolean;
  overrideEditorConfig?: boolean;
}

function getUriScheme(uri: string): string {
  const match = /^([a-zA-Z][a-zA-Z\d+\-.]*):/.exec(uri);
  return match?.[1] ?? 'unknown';
}

function collectSceneAssetReferences(cesdk: CreativeEditorSDK): PersistedAssetReference[] {
  const transientByUri = new Map(
    cesdk.engine.editor
      .findAllTransientResources()
      .map((resource) => [resource.URL, resource.size] as const)
  );

  return cesdk.engine.editor.findAllMediaURIs().map((uri) => {
    const size = transientByUri.get(uri);

    return {
      uri,
      scheme: getUriScheme(uri),
      transient: size !== undefined,
      ...(size !== undefined ? { size } : {})
    };
  });
}

/**
 * Register actions and configure the navigation bar for the Advanced Editor.
 *
 * This function sets up all custom actions needed for a professional editing workflow.
 * Override these implementations to integrate with your backend or add custom functionality.
 *
 * @param cesdk - The CreativeEditorSDK instance to configure
 *
 * @example Running actions programmatically
 * ```typescript
 * // Run built-in actions
 * await cesdk.actions.run('saveScene');
 * await cesdk.actions.run('exportDesign', { mimeType: 'image/png' });
 * await cesdk.actions.run('zoom.toPage', { page: 'current' });
 *
 * // Run custom actions with options
 * await cesdk.actions.run('exportImage'); // PNG export
 * await cesdk.actions.run('exportScene', { format: 'archive' }); // .cesdk export
 * await cesdk.actions.run('importScene', { format: 'scene' }); // Import .scene file
 * ```
 *
 * @example Customizing actions for backend integration
 * ```typescript
 * // Replace local download with API upload
 * cesdk.actions.register('saveScene', async () => {
 *   const scene = await cesdk.engine.scene.saveToString();
 *   await fetch('/api/save-scene', {
 *     method: 'POST',
 *     body: scene,
 *     headers: { 'Content-Type': 'application/json' }
 *   });
 * });
 * ```
 */
export function setupActions(cesdk: CreativeEditorSDK): void {
  // ============================================================================
  // SAVE & EXPORT ACTIONS
  // Actions for persisting and exporting user designs
  // ============================================================================

  // #region Save Scene Action
  // Save the current scene as a .scene JSON file for later editing
  // This preserves all layers, assets, and editing state
  cesdk.actions.register('saveScene', async () => {
    const scene = await cesdk.engine.scene.saveToString();
    await cesdk.utils.downloadFile(scene, 'text/plain;charset=UTF-8');
  });
  // #endregion

  // #region Save Scene For Database Action
  // Create a JSON payload for DB persistence with scene content + referenced media.
  // Uses scene.saveToString({ onDisallowedResourceScheme }) so blob/file resources can
  // be uploaded and replaced with persistent URLs before storing.
  cesdk.actions.register(
    'saveSceneForDatabase',
    async (options: SaveSceneForDatabaseOptions = {}): Promise<PersistedScenePayload> => {
      const persistResource = options.persistResource;
      const scene = await cesdk.engine.scene.saveToString({
        ...(options.allowedResourceSchemes
          ? { allowedResourceSchemes: options.allowedResourceSchemes }
          : {}),
        ...(persistResource
          ? {
            onDisallowedResourceScheme: (url: string, dataHash: string) =>
              persistResource({ url, dataHash })
          }
          : {})
      });

      return {
        version: 1,
        savedAt: new Date().toISOString(),
        scene,
        assets: collectSceneAssetReferences(cesdk)
      };
    }
  );

  // Convenience action for debugging and local flows: export DB payload as JSON file.
  cesdk.actions.register(
    'exportSceneForDatabase',
    async (options: SaveSceneForDatabaseOptions = {}): Promise<PersistedScenePayload> => {
      const payload = (await cesdk.actions.run(
        'saveSceneForDatabase',
        options
      )) as PersistedScenePayload;

      await cesdk.utils.downloadFile(
        new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      );

      return payload;
    }
  );

  // Load a persisted DB payload (object or JSON string) back into CE.SDK.
  cesdk.actions.register('loadSceneFromDatabase', async (options: LoadSceneFromDatabaseOptions) => {
    const payload =
      typeof options.payload === 'string'
        ? (JSON.parse(options.payload) as PersistedScenePayload)
        : options.payload;

    if (!payload?.scene) {
      throw new Error('Invalid persisted scene payload: missing scene.');
    }

    await cesdk.engine.scene.loadFromString(
      payload.scene,
      options.overrideEditorConfig ?? false,
      options.waitForResources ?? true
    );

    await cesdk.actions.run('zoom.toPage', { page: 'first' });

    return payload;
  });
  // #endregion

  // #region Export Design Action
  // Export the design as an image or PDF with custom options
  // Accepts exportOptions parameter to control format, dimensions, quality, etc.
  cesdk.actions.register('exportDesign', async (exportOptions) => {
    const { blobs, options } = await cesdk.utils.export(exportOptions);
    await cesdk.utils.downloadFile(blobs[0], options.mimeType);
  });
  // #endregion

  // #region Export Image Action
  // Quick export action for PNG images at standard size
  // Pre-configured for common social media dimensions (1080x1080)
  cesdk.actions.register('exportImage', async () => {
    const { blobs, options } = await cesdk.utils.export({
      mimeType: 'image/png',
      targetWidth: 1080,
      targetHeight: 1080
    });
    await cesdk.utils.downloadFile(blobs[0], options.mimeType);
  });
  // #endregion

  // #region Export Scene Action
  // Export scene in two formats:
  // - 'scene': .scene JSON file (text format, no assets)
  // - 'archive': .cesdk ZIP archive (includes embedded assets)
  cesdk.actions.register('exportScene', async ({ format = 'scene' }) => {
    await cesdk.utils.downloadFile(
      format === 'archive'
        ? await cesdk.engine.scene.saveToArchive()
        : await cesdk.engine.scene.saveToString(),
      format === 'archive' ? 'application/zip' : 'text/plain;charset=UTF-8'
    );
  });
  // #endregion

  // ============================================================================
  // IMPORT ACTIONS
  // Actions for loading existing scenes and assets
  // ============================================================================

  // #region Import Scene Action
  // Import a scene from file system in two formats:
  // - 'scene': .scene JSON file (references external assets)
  // - 'archive': .cesdk ZIP archive (includes embedded assets)
  cesdk.actions.register('importScene', async ({ format = 'scene' }) => {
    if (format === 'scene') {
      // Import .scene file (JSON text)
      const scene = await cesdk.utils.loadFile({
        accept: '.scene',
        returnType: 'text'
      });
      await cesdk.engine.scene.loadFromString(scene);
    } else {
      // Import .cesdk archive file (ZIP)
      const blobURL = await cesdk.utils.loadFile({
        accept: '.zip',
        returnType: 'objectURL'
      });
      try {
        await cesdk.engine.scene.loadFromArchiveURL(blobURL);
      } finally {
        // Clean up temporary blob URL
        URL.revokeObjectURL(blobURL);
      }
    }

    // Zoom to fit the imported scene
    await cesdk.actions.run('zoom.toPage', { page: 'first' });
  });
  // #endregion

  // ============================================================================
  // UPLOAD ACTIONS
  // Actions for handling user-uploaded assets
  // ============================================================================

  // #region Upload File Action
  // Handle file uploads for images, videos, and other assets
  // Creates local blob URLs for immediate use in the editor
  cesdk.actions.register('uploadFile', (file, onProgress, context) => {
    return cesdk.utils.localUpload(file, context);
  });
  // #endregion

  // ============================================================================
  // CUSTOM ACTIONS
  // Add your own actions for custom functionality
  // ============================================================================

  // #region Share Action (Example)
  // Example: Share exported design using Web Share API
  // Falls back to download if sharing is not available
  //
  // cesdk.actions.register('share', async () => {
  //   const { blobs } = await cesdk.utils.export({ mimeType: 'image/png' });
  //   const file = new File([blobs[0]], 'design.png', { type: 'image/png' });
  //
  //   if (navigator.share && navigator.canShare({ files: [file] })) {
  //     await navigator.share({
  //       files: [file],
  //       title: 'My Design',
  //       text: 'Check out my design!'
  //     });
  //   } else {
  //     await cesdk.utils.downloadFile(blobs[0], 'image/png');
  //   }
  // });
  // #endregion
}
