const express = require('express')
const wishlistController = require('../controllers/wishlist-controller')
const { auth, authorize } = require('../middlewares/auth')

const router = express.Router()

router.post('/', auth, wishlistController.addWishlist)
router.get('/list', auth, wishlistController.getWishlist)
router.delete('/:gameId', auth, wishlistController.removeWishlist)

module.exports = router