import { Router } from 'express';
// import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { InfoController } from './info.controller';
import { InfoValidation } from './info.validation';

const router = Router();

// Get all profiles summary
router.get(
  '/summary',
  /* auth('user', 'admin'), */
  InfoController.getAllProfilesSummary
);

// Get business info by business profile ID
router.get(
  '/:businessProfileId',
  /* auth('user', 'admin'), */
  validateRequest(InfoValidation.getBusinessInfoValidationSchema),
  InfoController.getBusinessInfo
);

export const InfoRoute = router;
