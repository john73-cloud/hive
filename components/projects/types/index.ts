export type ProjectData =
    | object
    | unknown[]
    | string
    | number
    | boolean
    | null;

export type Project = {
    id: number;
    name: string;
    data: ProjectData;
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
    projectId: number;
    values: UpdateProjectFormValues;
};

export type DeleteProjectResponse = {
    message: string;
};
