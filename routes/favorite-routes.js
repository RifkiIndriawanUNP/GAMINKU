const express = require('express')
const favoriteController = require('../controllers/favorite-controller')
const { auth, authorize } = require('../middlewares/auth')
const router = express.Router()

router.post('/', auth, favoriteController.addFavorite)
router.get('/list', auth, favoriteController.getFavorites)
router.delete('/:gameId', auth, favoriteController.removeFavorite)

module.exports = router