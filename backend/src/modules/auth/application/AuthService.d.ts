import { Account } from '../domain/Account';
import { type Role } from '../../../shared/enums/Role';
export declare class AuthService {
    private readonly authRepository;
    private readonly userRepository;
    private readonly jwtSecret;
    decodeGoogleToken(idToken: string): Promise<import("google-auth-library").TokenPayload | null>;
    findOrCreateUserFromGoogle(payload: any): Promise<{
        account: Account;
        user: import("../../users/domain/User").User | null;
    }>;
    register(data: {
        email: string;
        password: string;
        role: Role;
        username: string;
    }): Promise<Account>;
    createJWT(payload: {
        id: number;
        email: string;
        role: string;
    }): Promise<string>;
    login(email: string, password: string): Promise<{
        token: string;
        account: {
            email: string;
            role: Role;
        };
        user: {
            id: number;
            name: string;
            lastname: string;
        } | null;
    }>;
    getUserByAccountID(accountID: number): Promise<import("../../users/domain/User").User | null>;
}
