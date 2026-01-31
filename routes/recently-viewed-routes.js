const express = require('express')
const recentlyViewedController = require('../controllers/recently-viewed-controller')
const { auth, authorize } = require('../middlewares/auth')
const router = express.Router()

router.post('/', auth, recentlyViewedController.addRecentlyViewed)
router.get('/list', auth, recentlyViewedController.getRecentlyViewed)
router.delete('/clear', auth, recentlyViewedController.clearRecentlyViewed)

module.exports = router