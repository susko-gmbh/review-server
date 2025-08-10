import { Router } from 'express';
import { WebhookController } from './webhook.controller';

const router = Router();

// Webhook endpoints (no auth required for external services like n8n)
router.post('/reviews', WebhookController.receiveReviewData);
router.get('/status', WebhookController.getWebhookStatus);

export const WebhookRoute = router;