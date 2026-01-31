const { pool } = require('../config/database')
const createWishlist = require('../models/wishlist-model')

// add wishlist
const addWishlist = async (req, res) => {
    const userId = req.user.userId
    const { gameId, gameData } = req.body

    if (!gameId) {
        return res.status(400).json({ msg: 'Game ID required!' })
    }

    try {
        const [check] = await pool.execute(
            'SELECT id FROM wishlist WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        )
        
        if (check.length > 0) {
            return res.status(409).json({ msg: 'Game already in wishlist' })
        }

        await pool.execute(
            'INSERT INTO wishlist (user_id, game_id, game_data) VALUES (?, ?, ?)',
            [userId, gameId, JSON.stringify(gameData)]
        )

        return res.status(201).json({ msg: 'Game added to wishlist' })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to add to wishlist' })
    }
}

// Get wishlist
const getWishlist = async (req, res) => {
    const userId = req.user.userId

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        )
        
        const wishlist = rows.map(createWishlist)

        return res.status(200).json({ wishlist: wishlist })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to get wishlist' })
    }
}

// Delete Wishlist
const removeWishlist = async (req, res) => {
    const userId = req.user.userId
    const gameId = req.params.gameId

    try {
        const [result] = await pool.execute(
            'DELETE FROM wishlist WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        )
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Wishlist item not found' })
        }

        return res.status(200).json({ msg: 'Removed from wishlist' })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to remove from wishlist' })
    }
}

module.exports = { addWishlist, getWishlist, removeWishlist }