import express from 'express';
const router = express.Router();
import UserController from '../controlllers/userController.js';
import checkUserAuth from '../middlewares/auth-middleware.js';

//Route level Middleware - To Protect Route
router.use('/changePassword', checkUserAuth)
router.use("/loggedUser", checkUserAuth);

// Public Routes
router.post('/signUp', UserController.userRegistration);
router.post("/signIn", UserController.userLogin);
router.post("/reset-password", UserController.sendUserResetPasswordEmail);
router.post("/reset-password/:id/:token", UserController.userPasswordReset);

// Protected Routes
router.post('/changePassword', UserController.changeUserPassword);
router.get("/loggedUser", UserController.loggedUser); 

export default router; 