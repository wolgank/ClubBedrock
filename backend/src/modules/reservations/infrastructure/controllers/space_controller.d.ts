import type { Context } from 'hono';
export declare const getAll: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    id: number;
    name: string;
    description: string | null;
    reference: string | null;
    capacity: number;
    urlImage: string | null;
    costPerHour: string;
    canBeReserved: boolean | null;
    isAvailable: boolean;
    type: "SPORTS" | "LEISURE";
}[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const getOne: (c: Context) => Promise<Response>;
export declare const getByType: (c: Context) => Promise<Response>;
export declare const create: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            name?: string[] | undefined;
            type?: string[] | undefined;
            description?: string[] | undefined;
            reference?: string[] | undefined;
            capacity?: string[] | undefined;
            urlImage?: string[] | undefined;
            costPerHour?: string[] | undefined;
            canBeReserved?: string[] | undefined;
            isAvailable?: string[] | undefined;
        };
    };
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    id: number;
    name: string;
    description: string | null;
    reference: string | null;
    capacity: number;
    urlImage: string | null;
    costPerHour: string;
    canBeReserved: boolean | null;
    isAvailable: boolean;
    type: "SPORTS" | "LEISURE";
}, 201, "json">)>;
export declare const update: (c: Context) => Promise<(Response & import("hono").TypedResponse<null, 204, "body">) | (Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            name?: string[] | undefined;
            type?: string[] | undefined;
            description?: string[] | undefined;
            reference?: string[] | undefined;
            capacity?: string[] | undefined;
            urlImage?: string[] | undefined;
            costPerHour?: string[] | undefined;
            canBeReserved?: string[] | undefined;
            isAvailable?: string[] | undefined;
        };
    };
}, 400, "json">)>;
export declare const remove: (c: Context) => Promise<Response & import("hono").TypedResponse<null, 204, "body">>;
