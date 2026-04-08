export type SignupFormValues = {
    name: string;
    email: string;
    password: string;
};

export type SignupResponse = {
    user: {
        id: number;
        name: string;
        email: string;
    };
    token: string;
};
