const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Helper used by controllers to extract role from session claims
const getRole = (req) =>
  req.auth.sessionClaims?.metadata?.role ||
  req.auth.sessionClaims?.public_metadata?.role;

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];

  return (req, res, next) => {
    const userRole = getRole(req);

    if (!userRole) {
      return res.status(403).json({ message: 'Forbidden: No role found on token' });
    }
    if (roles.length && !roles.includes(userRole)) {
      return res.status(403).json({ message: `Forbidden: requires ${roles.join(' or ')}` });
    }
    next();
  };
};

module.exports = { ClerkExpressRequireAuth, authorize, getRole };
