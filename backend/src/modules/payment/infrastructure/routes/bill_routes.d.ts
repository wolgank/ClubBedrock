declare const billRouter: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $get: {
            input: {};
            output: {
                id: number;
                finalAmount: string;
                status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
                description: string | null;
                createdAt: string;
                dueDate: string | null;
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
                        id?: string[] | undefined;
                        status?: string[] | undefined;
                        description?: string[] | undefined;
                        finalAmount?: string[] | undefined;
                        createdAt?: string[] | undefined;
                        dueDate?: string[] | undefined;
                        userId?: string[] | undefined;
                    };
                };
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: {
                id: number;
                finalAmount: string;
                status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
                description: string | null;
                createdAt: string;
                dueDate: string | null;
                userId: number;
            };
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
                        status?: string[] | undefined;
                        description?: string[] | undefined;
                        finalAmount?: string[] | undefined;
                        createdAt?: string[] | undefined;
                        dueDate?: string[] | undefined;
                        userId?: string[] | undefined;
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
} & {
    "/:id/recalculate": {
        $post: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                error: string;
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                billId: number;
                finalAmount: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                error: any;
            };
            outputFormat: "json";
            status: 500;
        };
    };
}, "/">;
export default billRouter;
