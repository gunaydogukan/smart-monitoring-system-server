const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Token doğrulama işlemi
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token formatı

    if (!token) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Token eksik.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Geçersiz token.' });

        req.user = user; // Kullanıcı bilgilerini request'e ekliyoruz
        next();
    });
};

// Rol yetkilendirme işlemi
const authorizeRole = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    next();
};

module.exports = { authenticateToken, authorizeRole };
