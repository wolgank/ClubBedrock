import type { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ClubService } from '../../application/ClubService'
import { clubUpdateSchema } from '../../../../db/schema/Club'
export class ClubController {
  async getConfig(c: Context) {
    try {
      const config = await ClubService.getClub()
      return c.json(config)
    } catch (err) {
      console.error(err)
      return c.json({ error: 'Error al obtener configuración del club' }, 500)
    }
  }

  async updateConfig(c: Context) {
    try {
      const body = await c.req.json()
      const parse = clubUpdateSchema.safeParse(body)
      if (!parse.success) {
        return c.json({ error: 'Datos inválidos', details: parse.error.format() }, 400)
      }

      const dataToUpdate = {
        ...parse.data,
        moratoriumRate: parse.data.moratoriumRate !== undefined ? String(parse.data.moratoriumRate) : undefined,
        devolutionReservationRate: parse.data.devolutionReservationRate !== undefined ? String(parse.data.devolutionReservationRate) : undefined,
        devolutionEventInscriptionRate: parse.data.devolutionEventInscriptionRate !== undefined ? String(parse.data.devolutionEventInscriptionRate) : undefined,
        devolutionAcademyInscriptionRate: parse.data.devolutionAcademyInscriptionRate !== undefined ? String(parse.data.devolutionAcademyInscriptionRate) : undefined,
      }

      const existingClub = await ClubService.getClub();
      if (existingClub) {
        c.set("auditRowId", existingClub.id);
      }

      const updated = await ClubService.updateClub(dataToUpdate)
      return c.json(updated)
    } catch (err) {
      console.error(err)
      return c.json({ error: 'Error al actualizar configuración del club' }, 500)
    }
  }
}
