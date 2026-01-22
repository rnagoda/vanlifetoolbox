import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/user/me
 * Returns the current authenticated user's information.
 * Creates the user in our database if they don't exist (first-time sync from Supabase).
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User email not found in token',
        },
      });
      return;
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // First time this user is accessing our API - sync from Supabase
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
        },
      });
    } else if (user.email !== email) {
      // Email changed in Supabase, update our record
      user = await prisma.user.update({
        where: { id: userId },
        data: { email: email },
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/me:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user information',
      },
    });
  }
});

export default router;
