export type ProjectData =
    | object
    | unknown[]
    | string
    | number
    | boolean
    | null;

export type ProjectSceneData = Record<string, unknown>;

export type ProjectSceneHistoryEntry = {
    data: ProjectSceneData;
    instruction: string;
    editedAt: string;
    editedByUserId?: number;
    model?: string;
};

export type Project = {
    id: number;
    name: string;
    data: ProjectData;
    history?: ProjectSceneHistoryEntry[];
    organizationId: number;
    createdAt: string;
    updatedAt: string;
};

export type CreateProjectFormValues = {
    name: string;
    data: ProjectData;
};

export type UpdateProjectFormValues = {
    name?: string;
    data?: ProjectData;
};

export type UpdateProjectPayload = {
    projectId: string;
    values: UpdateProjectFormValues;
};

export type DeleteProjectResponse = {
    message: string;
};

export type PreviewSceneEditRequest = {
    instruction: string;
};

export type ApplySceneEditRequest = {
    instruction: string;
    data: ProjectSceneData;
};
