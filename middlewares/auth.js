const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } 
    catch (error) {
        return res.status(401).json({ msg: 'Token is not valid' })
    }
}
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ msg: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Admin access required' });
        }
        
        next();
    };
};
module.exports = {auth, authorize}