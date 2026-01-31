require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDB } = require('./config/database')
const logger = require('./middlewares/logger')

const app = express()
const PORT = process.env.PORT || 5000

connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Import routes
const authRoutes = require('./routes/auth-routes')
const userRoutes = require('./routes/user-routes')
const gameRoutes = require('./routes/game-routes')
const favoriteRoutes = require('./routes/favorite-routes')
const wishlistRoutes = require('./routes/wishlist-routes')
const recentlyViewedRoutes = require('./routes/recently-viewed-routes')

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/games/favorites', favoriteRoutes)
app.use('/api/games/wishlist', wishlistRoutes)
app.use('/api/games/recently-viewed', recentlyViewedRoutes)

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to gaminku API',
        endpoints: {
            auth: '/api/auth',
            games: '/api/games',
            users: '/api/users',
            favorites: '/api/games/favorites',
            wishlist: '/api/games/wishlist'
        },
        version: '2.0.0'
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});



// Start server
app.listen(PORT, () => {
    logger.info(`=== gaminku API Server Started ===`);
    logger.info(`🔗 Click: http://localhost:${PORT}`);
})