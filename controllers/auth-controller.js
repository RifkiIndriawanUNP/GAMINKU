const jwt = require('jsonwebtoken')
const { pool } = require('../config/database')
const createUser = require('../models/user-model')

const register = async (req, res) => {
    const { username, email, password } = req.body
    
    if (!username || !email || !password) {
        return res.status(400).json({ msg: 'All fields required!' })
    }

    try {
        const [emailCheck] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        )
        
        if (emailCheck.length > 0) {
            return res.status(400).json({ msg: 'Email already registered' })
        }

        const [usernameCheck] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        )
        
        if (usernameCheck.length > 0) {
            return res.status(400).json({ msg: 'Username already taken' })
        }

        const role = 'user';

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role] // ⚠️ PASSWORD PLAIN TEXT!
        )

        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        const [rows] = await pool.execute(
            'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?',
            [result.insertId]
        )

        const user = createUser(rows[0])

        return res.status(201).json({
            msg: 'User registered successfully',
            token: token,
            user: user
        })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Server error' })
    }
}

const login = async (req, res) => {
    const { email, password } = req.body
    
    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password required' })
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        )
        
        if (users.length === 0) {
            return res.status(401).json({ msg: 'Invalid credentials' })
        }

        const user = users[0]

        const isValidPassword = (password === user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ msg: 'Invalid credentials' })
        }

        // Generate JWT token
        const token = jwt.sign(
        { 
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role  // TAMBAH INI
        },
         process.env.JWT_SECRET,
        { expiresIn: '7d' }
        );

        const userData = createUser(user)

        return res.status(200).json({
            msg: 'Login successful',
            token: token,
            user: userData
        })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Server error' })
    }
}

module.exports = { register, login }