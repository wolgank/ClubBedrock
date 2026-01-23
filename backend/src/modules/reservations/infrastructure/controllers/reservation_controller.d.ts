import type { Context } from 'hono';
export declare const getAll: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    id: number;
    name: string;
    date: string;
    startHour: string;
    endHour: string;
    capacity: number;
    allowOutsiders: boolean;
    description: string | null;
    spaceId: number;
}[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const getOne: (c: Context) => Promise<Response>;
export declare const create: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            date?: string[] | undefined;
            id?: string[] | undefined;
            name?: string[] | undefined;
            description?: string[] | undefined;
            capacity?: string[] | undefined;
            startHour?: string[] | undefined;
            endHour?: string[] | undefined;
            allowOutsiders?: string[] | undefined;
            spaceId?: string[] | undefined;
        };
    };
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    id: number;
    name: string;
    date: string;
    startHour: string;
    endHour: string;
    capacity: number;
    allowOutsiders: boolean;
    description: string | null;
    spaceId: number;
}, 201, "json">)>;
export declare const update: (c: Context) => Promise<(Response & import("hono").TypedResponse<null, 204, "body">) | (Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            date?: string[] | undefined;
            id?: string[] | undefined;
            name?: string[] | undefined;
            description?: string[] | undefined;
            capacity?: string[] | undefined;
            startHour?: string[] | undefined;
            endHour?: string[] | undefined;
            allowOutsiders?: string[] | undefined;
            spaceId?: string[] | undefined;
        };
    };
}, 400, "json">)>;
export declare const remove: (c: Context) => Promise<Response & import("hono").TypedResponse<null, 204, "body">>;
