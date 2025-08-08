import { Router } from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

// Public routes
router.post(
  '/register',
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.post(
  '/login',
  validateRequest(UserValidation.loginUserValidationSchema),
  UserController.loginUser
);

router.post('/logout', UserController.logoutUser);
router.post('/refresh-token', UserController.refreshToken);

// Protected routes
router.get('/profile', auth('user', 'admin'), UserController.getProfile);
router.get(
  '/shop/:shopName',
  auth('user', 'admin'),
  UserController.getShopData
);

export const UserRoute = router;
