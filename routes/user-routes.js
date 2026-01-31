const express = require('express')
const userController = require('../controllers/user-controller')
const { auth, authorize } = require('../middlewares/auth')
const router = express.Router()


// auth
router.get('/profile', auth, userController.getProfile)
router.put('/profile', auth, userController.updateProfile)
router.delete('/profile', auth, userController.deleteAccount)

// Admin 
router.get('/all', auth, authorize('admin'), userController.getAllUsers)
router.delete('/:id', auth, authorize('admin'), userController.deleteUserById)

router.get('/check-role', auth, (req, res) => {
    return res.status(200).json({ 
        role: req.user.role,
        isAdmin: req.user.role === 'admin'
    })
})

module.exports = router