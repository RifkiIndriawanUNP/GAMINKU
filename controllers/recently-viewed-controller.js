const { pool } = require('../config/database')
const createRecentlyViewed = require('../models/recently-viewed-model')

// Tambah game ke recently viewed
const addRecentlyViewed = async (req, res) => {
    const userId = req.user.userId
    const { gameId, gameData } = req.body

    if (!gameId) {
        return res.status(400).json({ msg: 'Game ID required!' })
    }

    try {
        await pool.execute(
            'INSERT INTO recently_viewed (user_id, game_id, game_data) VALUES (?, ?, ?)',
            [userId, gameId, JSON.stringify(gameData)]
        )

        await pool.execute(
            `DELETE FROM recently_viewed 
             WHERE user_id = ? 
             AND id NOT IN (
                 SELECT id FROM (
                     SELECT id FROM recently_viewed 
                     WHERE user_id = ? 
                     ORDER BY viewed_at DESC 
                     LIMIT 20
                 ) AS temp
             )`,
            [userId, userId]
        )

        return res.status(201).json({ msg: 'Game added to recently viewed' })
    } 
    catch (error) {
        console.error('Add recently viewed error:', error)
        return res.status(500).json({ msg: 'Failed to add to recently viewed' })
    }
}

// Get recently viewed games (max 20)
const getRecentlyViewed = async (req, res) => {
    const userId = req.user.userId

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM recently_viewed WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 20',
            [userId]
        )
        
        const recentlyViewed = rows.map(createRecentlyViewed)

        return res.status(200).json({ 
            recently_viewed: recentlyViewed,
            count: recentlyViewed.length 
        })
    } 
    catch (error) {
        console.error('Get recently viewed error:', error)
        return res.status(500).json({ msg: 'Failed to get recently viewed' })
    }
}

// Clear recently viewed history
const clearRecentlyViewed = async (req, res) => {
    const userId = req.user.userId

    try {
        await pool.execute(
            'DELETE FROM recently_viewed WHERE user_id = ?',
            [userId]
        )

        return res.status(200).json({ msg: 'Recently viewed cleared' })
    } 
    catch (error) {
        console.error('Clear recently viewed error:', error)
        return res.status(500).json({ msg: 'Failed to clear recently viewed' })
    }
}

module.exports = { addRecentlyViewed, getRecentlyViewed, clearRecentlyViewed }