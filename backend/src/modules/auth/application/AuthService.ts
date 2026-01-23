import { AuthRepository } from "../infrastructure/repositories/AuthRepository";
import { Account } from "../domain/Account";
import { sign, verify } from "hono/jwt";
import { role, type Role } from "../../../shared/enums/Role";
import { user, userInsertSchema } from "../../../db/schema/User";
import { UserRepository } from "../../users/infrastructure/repositories/UserRepository";
import { OAuth2Client } from "google-auth-library";
import { createUser } from "../../users/application/user_service";
import type { RegisterRequestBody, UpdateRequestBody } from "../domain/Account";
import { authInsertSchema } from "../../../db/schema/Auth";
import type { User } from "../../users/domain/User";
import type { DocumentType } from "../../../shared/enums/DocumentType";
import { PasswordResetTokenRepository } from "../infrastructure/repositories/PasswordResetToken";
import { logAuditory } from "../../../shared/utils/logAuditory";
const client = new OAuth2Client();
export class AuthService {
  private readonly authRepository = new AuthRepository();
  private readonly userRepository = new UserRepository();
  private readonly passwordResetTokenRepository = new PasswordResetTokenRepository();
  private readonly jwtSecret = process.env.JWT_SECRET!; // Asegúrate de tener esta env var
  async findByEmail(email: string) {
    const account = await this.authRepository.findByEmail(email);
    if (!account) {
      throw new Error("Account not found");
    }
    return account;
  }
  async createResetToken(auth: Account): Promise<string> {
    const payload = {
      sub: auth.id,
      email: auth.email,
      type: "password_reset",
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutos
    };
    const token = await sign(payload, this.jwtSecret);
    const result = await this.passwordResetTokenRepository.insert(
      token,
      auth.id,
      new Date(payload.exp * 1000)
    );
    if (!result) {
      throw new Error("Failed to create password reset token");
    }
    return token;
  }
  async resetPassword(token: string, newPassword: string): Promise<Account> {
    try {
      // 1. Verificar el token (JWT firmado)
      const payload = await verify(token, this.jwtSecret);
      const userId = payload.sub;
      if (!userId) {
        throw new Error("Invalid token");
      }
      // 2. Verificar que el token esté registrado y válido
      const tokenEntry = await this.passwordResetTokenRepository.findByToken(
        token
      );
      if (!tokenEntry) {
        throw new Error("Invalid or expired token");
      }
      if (tokenEntry.used) {
        throw new Error("Token already used");
      }
      // 4. Actualizar la contraseña del usuario
      const accountPasswordReseted = await this.updatePassword(tokenEntry.userId, newPassword);
      if (!accountPasswordReseted) {
        throw new Error("Failed to reset password");
      }
      //console.log(accountPasswordReseted);
      // 5. Marcar el token como usado
      const tokenMarkedAsUsed = await this.passwordResetTokenRepository.markAsUsed(token);
      if (!tokenMarkedAsUsed) {
        throw new Error("Failed to mark password reset token as used");
      }
      return accountPasswordReseted;
    } catch (err) {
      throw new Error("Failed to reset password: " + (err as Error).message);
    }
  }
  async updatePassword(
    userId: number,
    newPassword: string
  ): Promise<Account> {
    const account = await this.authRepository.findById(userId);
    if (!account) {
      throw new Error("Account not found");
    }
    const hashedPassword = await Bun.password.hash(newPassword);
    const updatedAccount = await this.authRepository.update(userId, {
      password: hashedPassword,
    });
    return updatedAccount;
  }
  async decodeGoogleToken(idToken: string) {
    try {
      const ticket = await client.verifyIdToken({ idToken });
      const payload = ticket.getPayload();
      //imprimimos el payload en la termina
      ////console.log('Google token payload:', payload);

      return payload || null;
    } catch (err) {
      console.error("Token verification failed:", err);
      return null;
    }
  }
  async findOrCreateUserFromGoogle(payload: any) {
    const { email, name, family_name, picture, sub: googleId } = payload;

    let account = await this.authRepository.findByEmail(email);

    if (account) {
      if (!account.isActive) throw new Error("Account inactive");

      // Actualizar googleId y oauthProvider si no están seteados o cambiaron
      if (account.googleId !== googleId || account.oauthProvider !== "google") {
        account = await this.authRepository.update(account.id, {
          googleId,
          oauthProvider: "google",
        });
      }
    } else {
      // Crear nuevo auth
      const newAuth = {
        email,
        username: email.split("@")[0],
        password: "", // Password must be a string, use empty string for OAuth accounts
        role: "GUEST" as Role, // Asignar rol GUEST por defecto
        isActive: true,
        googleId,
        oauthProvider: "google",
      };

      // Crear nuevo user
      const newUser = {
        lastname: family_name || "N/A",
        name: name || "N/A",
        documentType: undefined,
        documentID: undefined,
        phoneNumber: undefined,
        birthDate: undefined,
        gender: undefined,
        address: undefined,
        profilePictureURL: picture || undefined,
      };
      const result = await this.authRepository.createAccount({
        account: newAuth,
        user: newUser,
      });
      return result;
    }

    return { account, user };
  }
  async updateAllDetails(
    userNaccount: UpdateRequestBody
  ): Promise<{ account: Account; user: User }> {
    const userInsertSchemaWithOptionalAccountId = userInsertSchema.extend({
      accountID: userInsertSchema.shape.accountID.optional(),
    });
    const validatedAccount = authInsertSchema.parse(userNaccount.auth);
    const validatedUser = userInsertSchemaWithOptionalAccountId.safeParse(
      userNaccount.user
    );
    if(!validatedAccount.id){
      throw new Error("Invalid user data: missing account id\n");
    }
    if(!validatedUser.data?.id){
      throw new Error("Invalid user data: missing user id");
    }
    if(!validatedUser.data?.accountID){
      throw new Error("Invalid user data: missing account id");
    }
    if(validatedUser.data?.accountID != validatedAccount.id){
      throw new Error("Invalid user data: account id mismatch");
    }
    const hashedPassword = (
      validatedAccount?.password != undefined &&
      validatedAccount?.password != null
    ) ? await Bun.password.hash(validatedAccount.password) : null;

    // Ensure id and accountID are present and are numbers
    const userData = {
      ...validatedUser.data,
      id: validatedUser.data.id as number,
      accountID: validatedUser.data.accountID as number,
      birthDate: validatedUser.data.birthDate
        ? validatedUser.data.birthDate.toISOString().split("T")[0]
        : undefined,
    };

    const result = await this.authRepository.updateAllAccountDetails({
      account: {
        id: validatedAccount.id,
        email: validatedAccount.email,
        password: hashedPassword || undefined,
        username: validatedAccount.username ?? "",
        role: validatedAccount.role,
        isActive: true,
      },
      user: userData,
    });

    return result;
  }
  async register(
    userNaccount: RegisterRequestBody
  ): Promise<{ account: Account; user: User }> {
    const userInsertSchemaWithOptionalAccountId = userInsertSchema.extend({
      accountID: userInsertSchema.shape.accountID.optional(),
    });
    const validatedAccount = authInsertSchema.parse(userNaccount.auth);
    const validatedUser = userInsertSchemaWithOptionalAccountId.safeParse(
      userNaccount.user
    );

    if (!validatedUser.success) {
      throw new Error("Invalid user data: " + validatedUser.error.message);
    }
    if (
      validatedAccount?.password === undefined ||
      validatedAccount?.password === null
    ) {
      throw new Error("Password is required for account creation");
    }
    const existing = await this.authRepository.findByEmail(
      validatedAccount.email
    );
    if (existing) {
      throw new Error("Este email ya ha sido registrado.");
    }

    const hashedPassword = await Bun.password.hash(validatedAccount.password);

    const result = await this.authRepository.createAccount({
      account: {
        email: validatedAccount.email,
        password: hashedPassword,
        username: validatedAccount.username ?? "",
        role: validatedAccount.role,
        isActive: true,
      },
      user: {
        ...validatedUser.data,
        birthDate: validatedUser.data.birthDate
          ? validatedUser.data.birthDate.toISOString().split("T")[0] // "YYYY-MM-DD"
          : undefined,
      },
    });

    return result;
  }

  async simpleRegister(data: {
    email: string;
    password: string;
    role: Role;
    username: string;
  }): Promise<Account> {
    const existing = await this.authRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Este email ya ha sido registrado.");
    }
    if (data.username || !(data.username.trim() === "")) {
      const existingUsername = await this.authRepository.findByUsername(
        data.username
      );
      if (existingUsername) {
        throw new Error("Este username ya ha sido registrado.");
      }
    }
    const hashedPassword = await Bun.password.hash(data.password);

    const account = await this.authRepository.createSimpleAccount({
      email: data.email,
      password: hashedPassword,
      username: data.username,
      role: data.role,
      isActive: true,
    });

    // Crear nuevo user al registrado
    const newUser = {
      lastname: "N/A",
      name: "N/A",
      documentType: undefined,
      documentID: undefined,
      phoneNumber: undefined,
      birthDate: undefined,
      gender: undefined,
      address: undefined,
      profilePictureURL: undefined,
      accountID: account.id,
    };

    await createUser(newUser);

    return account;
  }

  async createJWT(payload: { id: number; email: string; role: string }) {
    logAuditory({ action: "LOGIN", table: "account", rowId: payload.id, accountId: payload.id, field: "*", previousValue: null, postValue: null, });
    return await sign(
      {
        sub: payload.id,
        email: payload.email,
        role: payload.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
      },
      this.jwtSecret
    );
  }

  async login(
    email: string,
    password: string
  ): Promise<{
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
  }> {
    const account = await this.authRepository.findByEmail(email);
    if (!account || !account.isActive) {
      throw new Error("Invalid credentials");
    }
    const isMatch = await Bun.password.verify(password, account.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
    const user = await this.userRepository.findByAccountID(account.id);

    const payload = {
      sub: account.id,
      email: account.email,
      role: account.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
    };

    const token = await sign(payload, this.jwtSecret);
    logAuditory({ action: "LOGIN", table: "account", rowId: payload.sub, accountId: payload.sub, field: "*", previousValue: null, postValue: null, });
    return {
      token,
      account: {
        email: account?.email,
        role: account?.role,
      },
      user: user
        ? {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
        }
        : null,
    };
  }
  async getUserByAccountID(accountID: number) {
    return await this.userRepository.findByAccountID(accountID);
  }
  async getAllAccounts() {
    return await this.authRepository.findAllWihtUser();
  }
  async getAccountById(id: number) {
    const account = await this.authRepository.findById(id);
    if (!account) {
      throw new Error("Account not found");
    }
    const user = await this.userRepository.findByAccountID(id);
    return {
      auth: {
        id: account.id,
        email: account.email,
        username: account.username,
        role: account.role,
        isActive: account.isActive,
        googleId: account.googleId,
        oauthProvider: account.oauthProvider,
      },
      user: user
        ? {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          documentType: user.documentType,
          documentID: user.documentID,
          phoneNumber: user.phoneNumber,
          birthDate: user.birthDate
            ? user.birthDate.toISOString()
            : undefined,
        }
        : null,
    };
  }
  async updateAccount(id: number, data: Partial<Account>) {
    const account = await this.authRepository.findById(id);
    if (!account) {
      throw new Error("Account not found");
    }
    if (data.password) {
      data.password = await Bun.password.hash(data.password);
    }
    const updatedAccount = await this.authRepository.update(id, data);
    const user = await this.userRepository.findByAccountID(id);
    return {
      account: {
        id: updatedAccount.id,
        email: updatedAccount.email,
        username: updatedAccount.username,
        role: updatedAccount.role,
        isActive: updatedAccount.isActive,
        googleId: updatedAccount.googleId,
        oauthProvider: updatedAccount.oauthProvider,
      },
    };
  }
  async logicalDeleteAccount(id: number) {
    const account = await this.authRepository.findById(id);
    if (!account) {
      throw new Error("Account not found");
    }
    account.deactivate();
    await this.authRepository.update(id, { isActive: false });
    return { message: "Account deactivated successfully" };
  }
}
