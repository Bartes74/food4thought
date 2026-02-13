import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET;

// Middleware do weryfikacji tokenu
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Brak konfiguracji JWT_SECRET na serwerze' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token nieprawidłowy lub wygasły' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware do sprawdzania roli admina
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Wymagane uprawnienia administratora' });
  }
  next();
};

// Middleware do sprawdzania roli super admina
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Wymagane uprawnienia super administratora' });
  }
  next();
};
// Middleware do sprawdzania konkretnych ról
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
};
