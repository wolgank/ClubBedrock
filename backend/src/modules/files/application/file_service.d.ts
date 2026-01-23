export declare function uploadFileLocal(file: File): Promise<string>;
export declare function downloadFileLocal(fileName: string): Promise<Response>;
export declare function deleteFileLocal(fileName: string): Promise<void>;
export declare function uploadFileS3(file: File): Promise<string>;
export declare function downloadFileS3(fileName: string): Promise<Response>;
export declare function deleteFileS3(fileName: string): Promise<void>;
