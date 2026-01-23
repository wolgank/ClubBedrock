import type { Role } from "../../../shared/enums/Role";
export declare class Account {
    readonly id: number;
    readonly email: string;
    password: string;
    username: string;
    role: Role;
    isActive: boolean;
    googleId: string;
    oauthProvider: string;
    constructor(id: number, email: string, password: string, username: string, role: Role, isActive: boolean, googleId?: string, oauthProvider?: string);
    deactivate(): void;
}
