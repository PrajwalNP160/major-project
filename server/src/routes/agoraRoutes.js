import express from 'express';
import { generateToken, renewToken } from '../controllers/agoraController.js';

const router = express.Router();

// Generate Agora RTC token
router.post('/token', generateToken);

// Renew Agora RTC token
router.post('/token/renew', renewToken);

export default router;
