// authMiddleware.js
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

    if (username === 'ondl' && password === '0c6GOe.4qIdDnKb37jYX9c4Qnjf') {
        next();
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
};