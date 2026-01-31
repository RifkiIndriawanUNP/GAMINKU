const { pool } = require('../config/database')
const createFavorite = require('../models/favorite-model')

const addFavorite = async (req, res) => {
    const userId = req.user.userId
    const { gameId, gameData } = req.body

    if (!gameId) {
        return res.status(400).json({ msg: 'Game ID required!' })
    }

    try {
        const [check] = await pool.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        )
        
        if (check.length > 0) {
            return res.status(409).json({ msg: 'Game already in favorites' })
        }

        await pool.execute(
            'INSERT INTO favorites (user_id, game_id, game_data) VALUES (?, ?, ?)',
            [userId, gameId, JSON.stringify(gameData)]
        )

        return res.status(201).json({ msg: 'Game added to favorites' })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to add favorite' })
    }
}

const getFavorites = async (req, res) => {
    const userId = req.user.userId

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        )
        
        const favorites = rows.map(createFavorite)

        return res.status(200).json({ favorites: favorites })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to get favorites' })
    }
}

const removeFavorite = async (req, res) => {
    const userId = req.user.userId
    const gameId = req.params.gameId

    try {
        const [result] = await pool.execute(
            'DELETE FROM favorites WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        )
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Favorite not found' })
        }

        return res.status(200).json({ msg: 'Favorite removed' })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to remove favorite' })
    }
}

module.exports = { addFavorite, getFavorites, removeFavorite }