import { Hono } from 'hono';
import * as billDetailController from '../../../payment/infrastructure/controllers/bill_detail_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 
const billDetailRouter = new Hono()
    .get('/', /*authMiddleware, */billDetailController.getAll)
    .get('/:id', billDetailController.getOne)
    .post('/', billDetailController.create)
    .put('/:id', billDetailController.update)
    .delete('/:id', billDetailController.remove)

export default billDetailRouter;
