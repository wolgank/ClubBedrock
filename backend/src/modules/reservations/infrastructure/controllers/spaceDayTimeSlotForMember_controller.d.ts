import type { Context } from 'hono';
export declare const getAll: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    id: number;
    day: string;
    startHour: string;
    endHour: string;
    spaceUsed: number;
}[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const getOne: (c: Context) => Promise<Response>;
export declare const create: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            startHour?: string[] | undefined;
            endHour?: string[] | undefined;
            day?: string[] | undefined;
            spaceUsed?: string[] | undefined;
        };
    };
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    id: number;
    day: string;
    startHour: string;
    endHour: string;
    spaceUsed: number;
}, 201, "json">)>;
export declare const update: (c: Context) => Promise<(Response & import("hono").TypedResponse<null, 204, "body">) | (Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            startHour?: string[] | undefined;
            endHour?: string[] | undefined;
            day?: string[] | undefined;
            spaceUsed?: string[] | undefined;
        };
    };
}, 400, "json">)>;
export declare const remove: (c: Context) => Promise<Response & import("hono").TypedResponse<null, 204, "body">>;
