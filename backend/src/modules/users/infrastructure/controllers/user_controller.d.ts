import type { Context } from "hono";
export declare const getAll: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    id: number;
    lastname: string;
    name: string;
    documentType: "DNI" | "CE" | "PASSPORT" | null;
    documentID: string | null;
    phoneNumber: string | null;
    birthDate: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    address: string | null;
    profilePictureURL: string | null;
    accountID: number;
}[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const getOne: (c: Context) => Promise<Response>;
export declare const create: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            name?: string[] | undefined;
            lastname?: string[] | undefined;
            documentType?: string[] | undefined;
            documentID?: string[] | undefined;
            phoneNumber?: string[] | undefined;
            birthDate?: string[] | undefined;
            gender?: string[] | undefined;
            address?: string[] | undefined;
            profilePictureURL?: string[] | undefined;
            accountID?: string[] | undefined;
        };
    };
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    id: number;
    lastname: string;
    name: string;
    documentType: "DNI" | "CE" | "PASSPORT" | null;
    documentID: string | null;
    phoneNumber: string | null;
    birthDate: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    address: string | null;
    profilePictureURL: string | null;
    accountID: number;
}, 201, "json">)>;
export declare const update: (c: Context) => Promise<(Response & import("hono").TypedResponse<null, 204, "body">) | (Response & import("hono").TypedResponse<{
    error: {
        formErrors: string[];
        fieldErrors: {
            id?: string[] | undefined;
            name?: string[] | undefined;
            lastname?: string[] | undefined;
            documentType?: string[] | undefined;
            documentID?: string[] | undefined;
            phoneNumber?: string[] | undefined;
            birthDate?: string[] | undefined;
            gender?: string[] | undefined;
            address?: string[] | undefined;
            profilePictureURL?: string[] | undefined;
            accountID?: string[] | undefined;
        };
    };
}, 400, "json">)>;
export declare const remove: (c: Context) => Promise<Response & import("hono").TypedResponse<null, 204, "body">>;
