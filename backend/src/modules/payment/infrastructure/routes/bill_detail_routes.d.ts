declare const billDetailRouter: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $get: {
            input: {};
            output: {
                id: number;
                billId: number;
                price: string;
                discount: string | null;
                finalPrice: string;
                description: string | null;
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
                        id?: string[] | undefined;
                        description?: string[] | undefined;
                        billId?: string[] | undefined;
                        price?: string[] | undefined;
                        discount?: string[] | undefined;
                        finalPrice?: string[] | undefined;
                    };
                };
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: {};
            outputFormat: "json";
            status: 201;
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
                        id?: string[] | undefined;
                        description?: string[] | undefined;
                        billId?: string[] | undefined;
                        price?: string[] | undefined;
                        discount?: string[] | undefined;
                        finalPrice?: string[] | undefined;
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
export default billDetailRouter;
