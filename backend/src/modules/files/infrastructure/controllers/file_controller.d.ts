import type { Context } from 'hono';
export declare const uploadLocalHandler: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    fileName: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const downloadLocalHandler: (c: Context) => Promise<Response>;
export declare const deleteLocalHandler: (c: Context) => Promise<Response & import("hono").TypedResponse<"File deleted", import("hono/utils/http-status").ContentfulStatusCode, "text">>;
export declare const uploadS3Handler: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    fileName: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare const downloadS3Handler: (c: Context) => Promise<Response>;
export declare const deleteS3Handler: (c: Context) => Promise<Response & import("hono").TypedResponse<"File deleted from S3", import("hono/utils/http-status").ContentfulStatusCode, "text">>;
