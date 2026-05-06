const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { ClerkExpressRequireAuth, getRole } = require('../middleware/clerk');

// POST /users/sync
// Called on every login. Tries to get role from:
// 1. Clerk session token (if session customization is set up)
// 2. Existing DB record (if user was seeded directly)
// Returns the role so frontend can route correctly.
router.post('/sync', ClerkExpressRequireAuth(), async (req, res) => {
  const { userId, sessionClaims } = req.auth;

  // Try token first
  const tokenRole = getRole(req);

  try {
    // Check if user already exists in DB
    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (existing) {
      // User exists — update role from token if available, otherwise keep DB role
      const role = tokenRole || existing.role;
      if (tokenRole && tokenRole !== existing.role) {
        await prisma.user.update({ where: { id: userId }, data: { role: tokenRole } });
      }
      return res.json({ synced: true, role });
    }

    // User doesn't exist in DB yet
    if (!tokenRole) {
      return res.status(400).json({
        message: 'No role found. Set role in Clerk Public Metadata and sign in again.',
      });
    }

    // Create user in DB
    const name = [sessionClaims?.firstName, sessionClaims?.lastName].filter(Boolean).join(' ')
      || sessionClaims?.name
      || 'User';
    const email = sessionClaims?.email || `${userId}@unknown.com`;

    const user = await prisma.user.create({
      data: { id: userId, name, email, role: tokenRole },
    });

    return res.json({ synced: true, role: user.role });
  } catch (err) {
    console.error('sync error:', err.message);
    res.status(500).json({ message: 'Server error during sync' });
  }
});

module.exports = router;
