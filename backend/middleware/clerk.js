const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Clerk puts custom claims at the root level after session token customization
    const userRole = req.auth.sessionClaims?.metadata?.role || req.auth.sessionClaims?.public_metadata?.role;

    if (!userRole) {
      return res.status(403).json({ message: 'Forbidden: Role not found' });
    }

    if (roles.length && !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { ClerkExpressRequireAuth, authorize };
