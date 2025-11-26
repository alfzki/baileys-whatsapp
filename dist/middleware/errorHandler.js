export const errorHandler = (error, req, res, next) => {
    console.error('Unhandled error:', error);
    const errorResponse = {
        success: false,
        message: 'Internal server error',
        error: error.message
    };
    if (process.env.NODE_ENV === 'development') {
        errorResponse.debug = {
            stack: error.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query
        };
    }
    res.status(500).json(errorResponse);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};
//# sourceMappingURL=errorHandler.js.map