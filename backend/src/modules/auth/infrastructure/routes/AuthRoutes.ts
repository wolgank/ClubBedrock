import { Hono } from "hono";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const authController = new AuthController();
const authRouter = new Hono()
  // Definimos las rutas para login y register
  .post("/register",  (c) => authController.register(c)) // por qué estaba eso
  .post("/simpleRegister", /*authMiddleware,*/ (c) => authController.simpleRegister(c))
  .post("/login", (c) => authController.login(c))
  .get("/healthcheck", authController.healthcheck)
  .post("/google", (c) => authController.googleTokenLogin(c))
  .get("/me", authMiddleware, (c) => authController.me(c))
  .get("/logout", (c) => authController.logout(c))
  .get("/accounts", authMiddleware, (c) => authController.getAccounts(c))
  .get("/:id", authMiddleware, (c) => authController.getAccountById(c))
  .put("/update/:id", authMiddleware, (c) => authController.updateAccount(c))
  .put("/updateAllDetails", authMiddleware, (c) => authController.updateAllDetailsAccount(c))
  .delete("/delete/:id", authMiddleware, (c) => authController.logicalDeleteAccount(c))
  .get("/roles",authMiddleware, (c) => authController.getRoles(c))
  .post("/forgot-password", (c) => authController.forgotPassword(c))
  .post("/reset-password", (c) => authController.resetPassword(c))
export default authRouter;

