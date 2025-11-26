export const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] ||
        req.headers['authorization']?.toString().replace('Bearer ', '');
    if (!apiKey) {
        res.status(401).json({
            success: false,
            message: 'API key is required'
        });
        return;
    }
    const validApiKeys = process.env.API_KEYS ?
        process.env.API_KEYS.split(',') :
        ['farabimusic'];
    if (!validApiKeys.includes(apiKey)) {
        res.status(401).json({
            success: false,
            message: 'Invalid API key'
        });
        return;
    }
    req.apiKey = apiKey;
    next();
};
export const optionalAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] ||
        req.headers['authorization']?.toString().replace('Bearer ', '');
    if (apiKey) {
        const validApiKeys = process.env.API_KEYS ?
            process.env.API_KEYS.split(',') :
            ['farabimusic'];
        if (validApiKeys.includes(apiKey)) {
            req.apiKey = apiKey;
        }
    }
    next();
};
//# sourceMappingURL=auth.js.map