const express = require('express')
const router = express.Router()
const { auth } = require('../middlewares/auth')
const { cacheMiddleware } = require('../config/cache')
const {
    searchGames,
    getPopularGames,
    getHighestRatedGames,
    getUpcomingGames,
    getGameDetailsByName,
    getGamesAZ,
    getPCGames,
    getPlayStationGames,
    getXboxGames,
    getNintendoGames,
    getMobileGames
} = require('../controllers/game-controller')

router.get('/search', cacheMiddleware(300), searchGames)
router.get('/popular', cacheMiddleware(600), getPopularGames)
router.get('/highest-rated', cacheMiddleware(600), getHighestRatedGames)
router.get('/upcoming', cacheMiddleware(300), getUpcomingGames)
router.get('/a-z/:letter', cacheMiddleware(600), getGamesAZ)
router.get('/pc', cacheMiddleware(600), getPCGames)
router.get('/playstation', cacheMiddleware(600), getPlayStationGames)
router.get('/xbox', cacheMiddleware(600), getXboxGames)
router.get('/nintendo', cacheMiddleware(600), getNintendoGames)
router.get('/mobile', cacheMiddleware(600), getMobileGames)
router.get('/:name', cacheMiddleware(3600), getGameDetailsByName)

router.use(auth)

module.exports = router