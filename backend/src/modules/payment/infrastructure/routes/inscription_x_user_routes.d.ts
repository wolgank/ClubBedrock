declare const inscription_x_user_Router: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $get: {
            input: {};
            output: {
                id: number;
                isCancelled: boolean;
                userId: number;
            }[];
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:id": {
        $get: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {};
            outputFormat: string;
            status: import("hono/utils/http-status").StatusCode;
        };
    };
} & {
    "/": {
        $post: {
            input: {};
            output: {
                error: {
                    formErrors: string[];
                    fieldErrors: {
                        userId?: string[] | undefined;
                        isCancelled?: string[] | undefined;
                    };
                };
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: 201;
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:id": {
        $put: {
            input: {
                param: {
                    id: string;
                };
            };
            output: null;
            outputFormat: "body";
            status: 204;
        } | {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                error: {
                    formErrors: string[];
                    fieldErrors: {
                        userId?: string[] | undefined;
                        isCancelled?: string[] | undefined;
                    };
                };
            };
            outputFormat: "json";
            status: 400;
        };
    };
} & {
    "/:id": {
        $delete: {
            input: {
                param: {
                    id: string;
                };
            };
            output: null;
            outputFormat: "body";
            status: 204;
        };
    };
}, "/">;
export default inscription_x_user_Router;
