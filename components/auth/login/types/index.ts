export type LoginFormValues = {
    email: string;
    password: string;
};

export type LoginResult = {
    redirectPath: string;
    domain: string | null;
};
