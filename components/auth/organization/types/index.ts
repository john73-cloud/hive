export type CreateOrganizationFormValues = {
    organizationName: string;
    domainName: string;
};

export type CreateOrganizationResponse = {
    message: string;
    user: {
        id: number;
        name: string;
        email: string;
        organization: {
            name: string;
            domain: {
                name: string;
            };
        };
    };
};

export type UserOrganizationResponse = {
    id: number;
    name: string;
    domain: {
        id: number;
        name: string;
    };
};
