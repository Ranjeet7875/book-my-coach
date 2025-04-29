const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Access Denied: No Token Provided" });
    }
    try {
        const decoded = jwt.verify(token, "your-secret-key");
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid Token" });
    }
};
module.exports = authMiddleware;
