import { db } from '../../../../db';
import { user } from '../../../../db/schema/User';
import { eq } from 'drizzle-orm';
import { User } from '../../domain/User';

export class UserRepository {
  async findByAccountID(accountID: number): Promise<User | null> {
    const result = await db.select().from(user).where(eq(user.accountID, accountID)).limit(1);
    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;

    return new User(
      row.id,
      row.lastname,
      row.name,
      row.documentType ?? "DNI",
      row.documentID ?? "",
      row.accountID,
      row.phoneNumber ?? undefined,
      row.birthDate ?? undefined,
      row.gender ?? undefined,
      row.address ?? undefined,
      row.profilePictureURL ?? undefined,
    );
  }
}
