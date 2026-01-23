import { AuthService } from "../../application/AuthService";
import { authInsertSchema } from "../../../../db/schema/Auth"; // Corrige tu path a schema centralizado
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { userInsertSchema } from "../../../../db/schema/User";
import { createUser } from "../../../users/application/user_service";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type Account,
  type RegisterRequestBody,
  type UpdateRequestBody,
} from "../../domain/Account";
import { role } from "../../../../shared/enums/Role";
import { sign } from "hono/jwt";
import { plantillasCorreo } from "../../../notifications/domain/notification_templates";
import { enviarCorreo } from "../../../notifications/application/notifications_service";
import { getMembershipByAccountId } from "../../../membership/application/membership_service";

export class AuthController {
  private readonly authService = new AuthService();
  async me(c: Context) {
    try {
      const account = c.get("account"); // ← directamente desde el middleware
      const getUser = await this.authService.getUserByAccountID(account.sub);
      const possibleMembership = await getMembershipByAccountId(account.sub);
      return c.json({ account: account, user: getUser, membership:possibleMembership }, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 401);
    }
  }
  async register(c: Context) {
    try {
      const body = await c.req.json<RegisterRequestBody>();

      // Crear cuenta
      const userNaccount = await this.authService.register(body);
      return c.json(
        {
          message: "Account created",
          account: {
            id: userNaccount.account.id,
            email: userNaccount.account.email,
            role: userNaccount.account.role,
          },
          user: {
            id: userNaccount.user?.id,
            name: userNaccount.user?.name,
            lastname: userNaccount.user?.lastname,
          },
        },
        201
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 400);
    }
  }

  async simpleRegister(c: Context) {
    try {
      const body = await c.req.json();
      const validatedData = authInsertSchema.parse(body);

      const account = await this.authService.simpleRegister({
        email: validatedData.email,
        username: validatedData.username ?? "",
        password: validatedData.password ?? "",
        role: validatedData.role,
      });

      return c.json(
        {
          message: "Account created",
          account: { id: account.id, email: account.email, role: account.role },
        },
        201
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 400);
    }
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const result = await this.authService.login(email, password);
      const { token, account, user } = result;

      // Establecer cookie segura con HttpOnly y otras opciones
      setCookie(c, "token", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60,
      });
      return c.json(
        {
          message: "Login successful",
          account: { email: account.email },
          user: { id: user?.id, name: user?.name, lastname: user?.lastname },
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 401);
    }
  }
  //nuevos métodos para Google OAuth
  //******************************************************************************** */
  async googleTokenLogin(c: Context) {
    try {
      const body = await c.req.json();
      ////console.log("Request body:", body);
      const idToken = body?.credentialResponse?.credential;
      ////console.log("ID Token:", idToken);
      if (!idToken) {
        return c.json({ error: "Missing idToken" }, 400);
      }
      const decoded = await this.authService.decodeGoogleToken(idToken);
      if (!decoded) {
        return c.json({ error: "Invalid ID token" }, 401);
      }
      const { account, user } =
        await this.authService.findOrCreateUserFromGoogle(decoded);

      if (!account) {
        return c.json(
          { error: "Account not found or could not be created" },
          500
        );
      }

      // Generar JWT
      const token = await this.authService.createJWT(account);

      // Setear cookie
      setCookie(c, "token", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      const safeAccount = {
      email: String(account.email),
      role: String(account.role),
    };

    const safeUser = user
      ? {
          id: Number(user.id),
          name: String(user.name),
          lastname: String(user.lastname),
        }
      : null;

    return c.json(
      {
        message: "Login successful",
        account: safeAccount,
        user: safeUser,
      },
      200
    );
      
    } catch (error) {
      console.error(error);
      return c.json(
        { message: (error as Error).message || "Error logging in" },
        500
      );
    }
  }

  async logout(c: Context) {
    c.header(
      "Set-Cookie",
      "token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict;"
    );
    return c.json({ message: "Logged out successfully" });
  }
  async healthcheck(c: Context) {
    return c.json({ message: "Auth service is running" }, 200);
  }
  async getAccounts(c: Context) {
    try {
      const accounts = await this.authService.getAllAccounts();
      return c.json(accounts, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 500);
    }
  }
  async getAccountById(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (isNaN(id)) {
        return c.json({ message: "Invalid ID" }, 400);
      }
      const account = await this.authService.getAccountById(id);
      if (!account) {
        return c.json({ message: "Account not found" }, 404);
      }
      return c.json(account, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 500);
    }
  }
  async updateAccount(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (isNaN(id)) {
        return c.json({ message: "Invalid ID" }, 400);
      }
      const body = await c.req.json();
      const authData = authInsertSchema.parse(body.auth);

      const cleanedAuthData = { ...authData };

      // Eliminar propiedad password si es null
      if (cleanedAuthData.password === null) {
        delete cleanedAuthData.password;
      }
      if (cleanedAuthData.googleId === "") {
        delete cleanedAuthData.googleId;
      }
      if (cleanedAuthData.oauthProvider == ""){
        delete cleanedAuthData.oauthProvider;
      }
      const updatedAccount = await this.authService.updateAccount(
        id,
        cleanedAuthData as Partial<Account>
      );
      return c.json(
        {
          message: "Account updated successfully",
          account: updatedAccount,
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 500);
    }
  }
  async updateAllDetailsAccount(c:Context){
    try{
      const body = await c.req.json<UpdateRequestBody>();
      const userNaccount = await this.authService.updateAllDetails(body);
      return c.json(
        {
          message: "Account created",
          account: {
            id: userNaccount.account.id,
            email: userNaccount.account.email,
            role: userNaccount.account.role,
          },
          user: {
            id: userNaccount.user?.id,
            name: userNaccount.user?.name,
            lastname: userNaccount.user?.lastname,
          },
        },
        201
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 400);
    }
  }
  async logicalDeleteAccount(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      if (isNaN(id)) {
        return c.json({ message: "Invalid ID" }, 400);
      }
      const deletedAccount = await this.authService.logicalDeleteAccount(id);
      return c.json(
        { message: "Account deleted successfully", account: deletedAccount },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 500);
    }
  }
  getRoles(c: Context) {
    return c.json(
      {
        roles: role,
      },
      200
    );
  }
  async forgotPassword(c: Context) {
    try {
      const body = await c.req.json();
      const { email } = forgotPasswordSchema.parse(body);

      // Buscar usuario por email
      const auth = await this.authService.findByEmail(email);
      if (!auth) {
        // Por seguridad, no revelamos si el usuario existe o no
        return c.json(
          {
            message:
              "If an account exists for that email, a reset link has been sent.",
          },
          200
        );
      }
      // Guardar token en la base de datos
      const token = await this.authService.createResetToken(auth);
      if (!token) {
        throw new Error("Failed to create reset token");
      }

      if (!plantillasCorreo.recuperarContrasena) {
        throw new Error("RecuperarContrasena template is not defined");
      }
      const { subject, message } = plantillasCorreo.recuperarContrasena({
        nombre: auth.username ?? "usuario", // Usa nombre si existe, si no, fallback
        extra: { token },
      });

      // Enviar correo
      await enviarCorreo({
        to: auth.email,
        subject,
        message,
      });

      return c.json(
        {
          message:
            "If an account exists for that email, a reset link has been sent.",
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: (error as Error).message }, 500);
    }
  }
  async resetPassword(c: Context) {
    try {
      const body = await c.req.json();
      const { token, newPassword } = resetPasswordSchema.parse(body);

      if (!token || !newPassword) {
        return c.json({ message: "Token and new password are required." }, 400);
      }
      const result = await this.authService.resetPassword(token,newPassword);
      if (!result) {
        return c.json(
          { message: "Invalid token or password reset failed." },
          400
        );
      }
      return c.json(
        { message: "Your password has been updated successfully." },
        200
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      return c.json({ message: "Internal server error." }, 500);
    }
  }
}
