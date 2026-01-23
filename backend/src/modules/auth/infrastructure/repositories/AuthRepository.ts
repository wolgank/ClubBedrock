import { db } from '../../../../db';
import { auth } from '../../../../db/schema/Auth';
import { eq } from 'drizzle-orm';
import { Account, type PublicAccount } from '../../domain/Account';
import { role, type Role } from '../../../../shared/enums/Role';
import { User } from '../../../users/domain/User';
import { user } from '../../../../db/schema/User';
import { UserRepository } from '../../../users/infrastructure/repositories/UserRepository';
import type { DocumentType } from '../../../../shared/enums/DocumentType';
import type { Gender } from '../../../../shared/enums/Gender';
export class AuthRepository {
  async update(id: number, data: Partial<Account>): Promise<Account> {
    // Supongamos que usas un query builder o directamente SQL con Bun / Drizzle ORM o cualquier librería.

    // Ejemplo con Drizzle ORM para MySQL (por ejemplo):
    const result = await db
      .update(auth)
      .set(data)
      .where(eq(auth.id, id));
    // Optionally, fetch the updated account to return it
    const updated = await this.findById?.(id);
    if (!updated) {
      throw new Error(`Failed to fetch updated Auth with id ${id}`);
    }
    return updated;
  }
  async findById(id: number): Promise<Account | null> {
    const result = await db.select().from(auth).where(eq(auth.id, id)).limit(1);
    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;
    return new Account(row.id, row.email, row.password ?? '', row.username ?? '', row.role as Role, row.isActive, row.googleId ?? '', row.oauthProvider ?? '');
  }
  async findByEmail(email: string): Promise<Account | null> {
    const result = await db.select().from(auth).where(eq(auth.email, email)).limit(1);
    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;
    return new Account(row.id, row.email, row.password ?? '', row.username, row.role as Role, row.isActive, row.googleId ?? '', row.oauthProvider ?? '');
  }
  async findByGoogleId(googleId: string): Promise<Account | null> {
    const result = await db.select().from(auth).where(eq(auth.googleId, googleId)).limit(1);
    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;

    return new Account(row.id, row.email, row.password ?? '', row.username ?? '', row.role as Role, row.isActive);
  }
  async findByUsername(username: string): Promise<Account | null> {
    const result = await db.select().from(auth).where(eq(auth.username, username)).limit(1);
    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;
    return new Account(row.id, row.email, row.password ?? '', row.username, row.role as Role, row.isActive);
  }
  async updateAllAccountDetails(data: {
    account: {
      id: number;
      email: string;
      password?: string;
      username: string;
      role: Role;
      isActive: boolean;
      googleId?: string;
      oauthProvider?: string;
    };
    user: {
      id: number;
      accountID: number;
      name: string;
      lastname: string;
      documentType?: DocumentType;
      documentID?: string;
      phoneNumber?: string;
      birthDate?: string;
      gender?: Gender;
      address?: string;
      profilePictureURL?: string;
    }
  }): Promise<{ account: Account; user: User }> {
    try {
      return await db.transaction(async (tx) => {
      // Desestructurar y excluir campos no actualizables (id)
      const { id: accountId, ...accountData } = data.account;
      const { id: userId, accountID: ignoredAccountId, ...userData } = data.user;

      // Actualizar cuenta
      await tx
        .update(auth)
        .set(accountData)
        .where(eq(auth.id, accountId));

      // Actualizar usuario
      await tx
        .update(user)
        .set({
          ...userData,
          birthDate: data.user.birthDate ? new Date(data.user.birthDate) : undefined,
        })
        .where(eq(user.id, userId));

      // Volver a obtener los datos actualizados
      const updatedAccountRow = await tx
        .select()
        .from(auth)
        .where(eq(auth.id, accountId))
        .limit(1)
        .then((res) => res[0]);

      if (!updatedAccountRow) throw new Error("No se pudo encontrar la cuenta actualizada");

      const updatedUserRow = await tx
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
        .then((res) => res[0]);

      if (!updatedUserRow) throw new Error("No se pudo encontrar el usuario actualizado");

      const updatedAccount: Account = new Account(
        updatedAccountRow.id,
        updatedAccountRow.email,
        "", // Nunca devolver password
        updatedAccountRow.username ?? "",
        updatedAccountRow.role,
        updatedAccountRow.isActive,
        updatedAccountRow.googleId ?? "",
        updatedAccountRow.oauthProvider ?? ""
      );

      const updatedUser: User = new User(
        updatedUserRow.id,
        updatedUserRow.name,
        updatedUserRow.lastname,
        updatedUserRow.documentType as DocumentType,
        updatedUserRow.documentID ?? "",
        updatedUserRow.accountID
      );

      return { account: updatedAccount, user: updatedUser };
    });
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error("Could not create account and user");
    }
  }
  async createAccount(data: {
    account: {
      email: string;
      password: string;
      username: string;
      role: Role;
      isActive: boolean;
      googleId?: string;
      oauthProvider?: string;
    };
    user: {
      name: string;
      lastname: string;
      documentType?: DocumentType;
      documentID?: string;
      phoneNumber?: string;
      birthDate?: string;
      gender?: Gender;
      address?: string;
      profilePictureURL?: string;
    }
  }): Promise<{ account: Account; user: User }> {
    if (!data.account.role) {
      data.account.role = "GUEST" as Role;
    }
    try {
      return await db.transaction(async (tx) => {
        const insertedId = await tx.insert(auth).values(data.account).$returningId().then((res) => res[0]);
        if (!insertedId) throw new Error('Failed to create account');
        const created = await tx.select().from(auth).where(eq(auth.id, insertedId.id)).limit(1).then(res => res[0]);
        if (!created) throw new Error('Failed to create account');
        const account: Account = new Account(
          created.id,
          created.email,
          "", // No se devuelve contraseña
          created.username ?? "",
          created.role,
          created.isActive,
          created.googleId ?? "",
          created.oauthProvider ?? ""
        );
        const userData = {
          ...data.user,
          accountID: account.id,
          birthDate: data.user.birthDate ? new Date(data.user.birthDate) : undefined,
        };
        const insertedIdUser = await tx.insert(user).values(userData).$returningId().then((res) => res[0]);
        if (!insertedIdUser) throw new Error('Failed to create user');
        const createdUser = await tx.select().from(user).where(eq(user.id, insertedIdUser.id)).limit(1).then(res => res[0]);
        if (!createdUser) throw new Error('Failed to create user');
        const userCreated: User = new User(
          createdUser.id,
          createdUser.name,
          createdUser.lastname,
          createdUser.documentType as DocumentType,
          createdUser.documentID ?? "",
          createdUser.accountID
        );
        return { account: account, user: userCreated };
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error("Could not create account and user");
    }
  }

  async createSimpleAccount(data: {
    email: string;
    password: string;
    username: string;
    role: Role;
    isActive: boolean;
    googleId?: string;
    oauthProvider?: string,
  }): Promise<Account> {
    const inserted = await db.insert(auth).values(data);
    const created = await this.findByEmail(data.email);
    if (!created) throw new Error('Failed to create account');
    return created;
  }

  async findAll(): Promise<PublicAccount[]> {
    const result = await db.select().from(auth).where(eq(auth.isActive, true));

    return result.map(row => ({
      id: row.id,
      email: row.email,
      username: row.username ?? '',
      role: row.role as Role,
      isActive: row.isActive,
      googleId: row.googleId ?? '',
      oauthProvider: row.oauthProvider ?? ''
    }));
  }
  async findAllWihtUser(): Promise<{ auth: PublicAccount; user: User }[]> {
    const result = await db
      .select()
      .from(auth)
      .innerJoin(user, eq(user.accountID, auth.id));

    return result.map(row => ({
      auth: ({
        id: row.auth.id,
        email: row.auth.email,
        username: row.auth.username ?? '',
        role: row.auth.role as Role,
        isActive: row.auth.isActive,
        googleId: row.auth.googleId ?? '',
        oauthProvider: row.auth.oauthProvider ?? ''
      }),
      user: new User(
        row.user.id,
        row.user.name,
        row.user.lastname,
        row.user.documentType as DocumentType,
        row.user.documentID ?? '',
        row.user.accountID
      )
    }));
  }
}
