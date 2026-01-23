import { Hono } from 'hono';
import * as inscription_x_user_Controller from '../controllers/inscription_x_user_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 
const inscription_x_user_Router = new Hono()
    .get('/', /*authMiddleware, */inscription_x_user_Controller.getAll)
    .get('/:id', inscription_x_user_Controller.getOne)
    .post('/', inscription_x_user_Controller.create)
    .put('/:id', inscription_x_user_Controller.update)
    .delete('/:id', inscription_x_user_Controller.remove)

export default inscription_x_user_Router;
