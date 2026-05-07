/**
 * Role-based access control middleware
 * Harus dipakai SETELAH verifyToken
 *
 * Contoh pemakaian:
 *   router.delete('/:id', verifyToken, authorizeRoles('admin'), controller.delete)
 *   router.get('/all',    verifyToken, authorizeRoles('teacher', 'admin'), controller.getAll)
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
