import type { Context } from "hono";
export declare class AuthController {
    private readonly authService;
    me(c: Context): Promise<(Response & import("hono").TypedResponse<{
        account: any;
        user: {
            readonly id: number;
            lastname: string;
            name: string;
            documentType: import("../../../../shared/enums/DocumentType").DocumentType;
            documentID: string;
            readonly accountID: number;
            phoneNumber?: string | undefined;
            birthDate?: string | undefined;
            gender?: import("../../../../shared/enums/Gender").Gender | undefined;
            address?: string | undefined;
            profilePictureURL?: string | undefined;
        } | null;
    }, 200, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, 401, "json">)>;
    register(c: Context): Promise<(Response & import("hono").TypedResponse<{
        message: string;
        account: {
            id: number;
            email: string;
            role: "ADMIN" | "MEMBER" | "GUEST" | "EVENTS" | "SPORTS" | "MEMBERSHIP";
        };
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, 400, "json">)>;
    login(c: Context): Promise<(Response & import("hono").TypedResponse<{
        message: string;
        account: {
            email: string;
        };
        user: {
            id: number | undefined;
            name: string | undefined;
            lastname: string | undefined;
        };
    }, 200, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, 401, "json">)>;
    googleTokenLogin(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 401, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        account: {
            email: string;
            role: "ADMIN" | "MEMBER" | "GUEST" | "EVENTS" | "SPORTS" | "MEMBERSHIP";
        };
        user: {
            id: number;
            name: string;
            lastname: string;
        } | null;
    }, 200, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, 500, "json">)>;
    logout(c: Context): Promise<Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    healthcheck(c: Context): Promise<Response & import("hono").TypedResponse<{
        message: string;
    }, 200, "json">>;
}
