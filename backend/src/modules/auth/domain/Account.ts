import type { Role } from "../../../shared/enums/Role";
import { z } from "zod";
import { authInsertSchema } from "../../../db/schema/Auth";
import { userInsertSchema } from "../../../db/schema/User";
export class Account {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public password: string,
    public username: string,
    public role: Role,
    public isActive: boolean,
    public googleId: string = '',
    public oauthProvider: string = 'google', // Por defecto, puede ser 'google', 'github', etc.
  ) {}

  deactivate() {
    this.isActive = false;
  }
}
export type PublicAccount = {
  id: number;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  googleId: string;
  oauthProvider: string;
};
// Extraer tipos desde Zod
type AuthInput = z.infer<typeof authInsertSchema>;
type UserInput = z.infer<typeof userInsertSchema>;

export type RegisterRequestBody = {
  auth: AuthInput;
  user: Omit<UserInput, "accountID"> & { accountID?: number };
};
export type UpdateRequestBody = {
  auth: AuthInput;
  user: UserInput;
};
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});