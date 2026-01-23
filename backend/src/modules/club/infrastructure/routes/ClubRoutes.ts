import { Hono } from 'hono'
import { ClubController } from '../controllers/ClubController'
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'
import { auditMiddleware } from '../../../../shared/middlewares/auditMiddleware';
const clubController = new ClubController()
const clubRouter = new Hono()
// GET /config/club → Obtener datos generales del club
.get('/club', (c) => clubController.getConfig(c))
// PUT /config/club → Actualizar datos del club
.put('/club', authMiddleware,auditMiddleware("UPDATE", "club"),(c) => clubController.updateConfig(c))

export default clubRouter;
