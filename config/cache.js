const NodeCache = require('node-cache');
const logger = require('../middlewares/logger');

const cache = new NodeCache({ 
    stdTTL: 300, 
    checkperiod: 60 
});

const getCachedData = async (key, fetchFunction, ttl = 300) => {
    try {
        const cachedData = cache.get(key);
        
        if (cachedData) {
            logger.info(`Cache hit for key: ${key}`);
            return cachedData;
        }
        
        logger.info(`Cache miss for key: ${key}`);
        const freshData = await fetchFunction();
        
        if (freshData) {
            cache.set(key, freshData, ttl);
            logger.info(`Data cached for key: ${key} (TTL: ${ttl}s)`);
        }
        
        return freshData;
    } catch (error) {
        logger.error(`Cache error for key ${key}:`, error);
        throw error;
    }
};

// Middleware 
const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        const key = `__express__${req.originalUrl || req.url}`;
        
        const cachedBody = cache.get(key);
        if (cachedBody) {
            logger.info(`Cache hit for API: ${req.originalUrl}`);
            return res.json(cachedBody);
        }
        
        const originalJson = res.json;
        res.json = function(body) {
            if (res.statusCode === 200 && !req.path.includes('/auth')) {
                cache.set(key, body, duration);
                logger.info(`API response cached: ${req.originalUrl} (TTL: ${duration}s)`);
            }
            originalJson.call(this, body);
        };
        
        next();
    };
};

module.exports = { cache, getCachedData, cacheMiddleware };