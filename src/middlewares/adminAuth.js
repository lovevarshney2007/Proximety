const adminAuth = (req, res, next) => {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: Admin API Key is missing. Include 'x-api-key' in headers.",
        });
    }

    if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: Invalid Admin API Key.",
        });
    }

    next();
};

export default adminAuth;
