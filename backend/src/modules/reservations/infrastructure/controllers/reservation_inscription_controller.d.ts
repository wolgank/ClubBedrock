import type { Context } from 'hono';
export declare const getAll: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    id: number;
    isCancelled: boolean;
    reservationId: number;
    inscriptionXUser: number;
}[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const getOne: (c: Context) => Promise<Response>;
export declare const update: (c: Context) => Promise<(Response & import("hono").TypedResponse<null, 204, "body">) | (Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            isCancelled?: string[] | undefined;
        };
    };
}, 400, "json">)>;
export declare const remove: (c: Context) => Promise<Response & import("hono").TypedResponse<null, 204, "body">>;
