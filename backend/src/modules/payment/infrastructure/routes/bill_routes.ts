import { Hono } from 'hono';
import * as billController from '../../../payment/infrastructure/controllers/bill_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 
const billRouter = new Hono()

    .post("/pay-admission-fee",authMiddleware, billController.payAdmissionFee)
    .get( "/admissionFee",  authMiddleware,  billController.fetchAdmissionFee)
        .get("/fees", authMiddleware, billController.listMemberFees)
        .get("/:id/fees", authMiddleware, billController.listMemberFeesForManager) //pal membresias manager

    .get("/fees", authMiddleware, billController.listMemberFees)

    .get("/fees", authMiddleware, billController.listMemberFees)
    .get("/:id/details", authMiddleware, billController.getBillWithDetails)

    
    .post("/pay", authMiddleware, billController.pay)
    .get('/', /*authMiddleware, */billController.getAll)
    .get('/:id', billController.getOne)
    .post('/', billController.create)
    .put('/:id', billController.update)
    .delete('/:id', billController.remove)
    .post("/:id/recalculate",  billController.recalculate)

export default billRouter;
