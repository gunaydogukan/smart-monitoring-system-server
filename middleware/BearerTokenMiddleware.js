const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Token doğrulama işlemi
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token formatı

    if (!token) {
        console.log("Token eksik.");
        return res.status(401).json({ error: 'Yetkisiz erişim. Token eksik.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token doğrulama hatası:", err.message);
            return res.status(403).json({ error: 'Geçersiz token.' });
        }

        console.log("Doğrulanan kullanıcı:", user); // Kullanıcı bilgilerini loglayın
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
