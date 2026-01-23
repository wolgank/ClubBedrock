import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { passwordResetToken } from "../../../../db/schema/PasswordResetToken";

export class PasswordResetTokenRepository {
  async insert(token: string, accountId: number, expiresAt: Date) {
    try {
      const result = await db
        .insert(passwordResetToken)
        .values({
          token,
          userId: accountId,
          expiresAt,
          used: false,
          createdAt: new Date(),
        })
        .$returningId()
        .then((r) => r[0]!);
        const [created] = await db
            .select()
            .from(passwordResetToken)
            .where(eq(passwordResetToken.id, result.id));
        return created;
    } catch (error) {
      console.error("Error inserting password reset token:", error);
      throw new Error("Failed to insert password reset token");
    }
  }
  async findByToken(token: string) {
    try {
      const result = await db
        .select()
        .from(passwordResetToken)
        .where(eq(passwordResetToken.token, token))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error finding password reset token:", error);
      throw new Error("Failed to find password reset token");
    }
  }
  async markAsUsed(token: string) {
    try {
      const id= await db
        .select()
        .from(passwordResetToken)
        .where(eq(passwordResetToken.token, token))
        .limit(1)
        .then((r) => r[0]?.id);
      if (!id) {
        throw new Error("Token not found");
      }
      //console.log("ID del token encontrado:", id);
      const result = await db
        .update(passwordResetToken)
        .set({ used: true })
        .where(eq(passwordResetToken.id, id));
      //console.log("Resultado del update:", result);
      const [updated] = await db
        .select()
        .from(passwordResetToken)
        .where(eq(passwordResetToken.id, id));
      //console.log("Token actualizado:", updated);
      if (!updated) {
        throw new Error("Failed to update password reset token");
      }
      if (updated.used !== true) {
        throw new Error("Failed to mark password reset token as used");
      }
      return updated;
    } catch (error) {
      console.error("Error marking password reset token as used:", error);
      throw new Error("Failed to mark password reset token as used");
    }
  }
}
