import { db } from '../../../db' 
import { club } from '../../../db/schema/Club' 
import { eq } from 'drizzle-orm'

export class ClubService {
  // Asumiendo que solo existe un club
  static async getClub() {
    const result = await db.select().from(club).limit(1)
    if (result[0]) return result[0];
    return {
      id: 0,
      name: "",
      slogan: "",
      logoUrl: "",
      moratoriumRate: 0,
      paymentDeadlineDays: 0,
      maxMemberReservationHoursPerDayAndSpace: 0,
      maxMemberReservationHoursPerDay: 0,
      maxGuestsNumberPerMonth: 0,
      devolutionReservationRate: 0,
      devolutionEventInscriptionRate: 0,
      devolutionAcademyInscriptionRate: 0,
      portadaURL: "",
      address: "",
      openHours: "",
      email: "",
      phone: "",
    };
  }

  static async updateClub(data: Partial<typeof club.$inferInsert>) {
    const existing = await this.getClub()
    if (!existing) {
      // Ensure all required fields are present before inserting
      const requiredFields = [
        'name', 
        'slogan', 
        'moratoriumRate',
        'paymentDeadlineDays',
        'maxMemberReservationHoursPerDayAndSpace', 
        'maxMemberReservationHoursPerDay', 
        'maxGuestsNumberPerMonth', 
        'devolutionReservationRate', 
        'devolutionEventInscriptionRate', 
        'devolutionAcademyInscriptionRate']
      for (const field of requiredFields) {
        if (data[field as keyof typeof data] === undefined) {
          throw new Error(`Missing required field: ${field}`)
        }
      }
      const insertedIds = await db.insert(club).values(data as typeof club.$inferInsert).$returningId()
      if (insertedIds.length === 0) return null
      const insertedClub = await db.select().from(club).where(eq(club.id, insertedIds[0]!.id)).limit(1)
      return insertedClub[0] ?? null
    }
    await db.update(club).set(data).where(eq(club.id, existing.id))
    return this.getClub()
  }
}
