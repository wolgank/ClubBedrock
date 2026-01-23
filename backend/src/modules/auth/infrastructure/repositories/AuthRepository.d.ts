import { Account } from '../../domain/Account';
import type { Role } from '../../../../shared/enums/Role';
export declare class AuthRepository {
    update(id: number, data: Partial<Account>): Promise<Account>;
    findById(id: number): Promise<Account | null>;
    findByEmail(email: string): Promise<Account | null>;
    findByGoogleId(googleId: string): Promise<Account | null>;
    findByUsername(username: string): Promise<Account | null>;
    createAccount(data: {
        email: string;
        password: string;
        username: string;
        role: Role;
        isActive: boolean;
        googleId?: string;
        oauthProvider?: string;
    }): Promise<Account>;
}
