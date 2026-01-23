import { User } from '../../domain/User';
export declare class UserRepository {
    findByAccountID(accountID: number): Promise<User | null>;
}
