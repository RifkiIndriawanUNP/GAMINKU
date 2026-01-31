const { pool } = require('../config/database')
const createUser = require('../models/user-model')

// Get profil
const getProfile = async (req, res) => {
    const userId = req.user.userId

    try {
        const [rows] = await pool.execute(
            'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?',
            [userId]
        )
        
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' })
        }

        const user = createUser(rows[0])
        return res.status(200).json(user)
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to get profile' })
    }
}

// update profil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const { username, email, avatar_url } = req.body
    
    console.log('Update request - User ID:', userId)
    console.log('Update data:', { username, email, avatar_url })

    const [userCheck] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    )
    
    if (userCheck.length === 0) {
      return res.status(404).json({ msg: 'User not found' })
    }

    const updates = []
    const values = []
    
    if (username && username.trim()) {
      const [usernameCheck] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username.trim(), userId]
      )
      
      if (usernameCheck.length > 0) {
        return res.status(400).json({ msg: 'Username already taken' })
      }
      
      updates.push('username = ?')
      values.push(username.trim())
    }
    
    if (email && email.trim()) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.trim(), userId]
      )
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ msg: 'Email already registered' })
      }
      
      updates.push('email = ?')
      values.push(email.trim())
    }
    
    if (avatar_url && avatar_url.trim()) {
      updates.push('avatar_url = ?')
      values.push(avatar_url.trim())
    }

    if (updates.length === 0) {
      return res.status(400).json({ msg: 'No fields to update' })
    }

    values.push(userId)
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    console.log('Executing query:', query)
    console.log('With values:', values)
    
    const [result] = await pool.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: 'Update failed' })
    }

    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    )

    const user = createUser(rows[0])
    return res.status(200).json({
      msg: 'Profile updated successfully',
      user: user
    })
    
  } catch (error) {
    console.error('Update profile error:', error.message)
    console.error('Stack:', error.stack)
    return res.status(500).json({ 
      msg: 'Failed to update profile',
      error: error.message 
    })
  }
}

const deleteAccount = async (req, res) => {
    const userId = req.user.userId

    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId])
        return res.status(200).json({ msg: 'Account deleted successfully' })
    } 
    catch (error) {
        console.error(error)
        return res.status(500).json({ msg: 'Failed to delete account' })
    }
}
const getAllUsers = async (req, res) => {
    try {
        // Cek apakah user adalah admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        const [rows] = await pool.execute(
            'SELECT id, username, email, avatar_url, role, created_at FROM users ORDER BY created_at DESC'
        );
        
        const users = rows.map(createUser);
        return res.status(200).json({ users: users });
    } 
    catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ msg: 'Failed to get users' });
    }
}
const deleteUserById = async (req, res) => {
    const userId = req.params.id;
    
    try {
        // cek Apakah user adalah admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }
        
        // Tidak boleh menghapus diri sendiri
        if (req.user.userId == userId) {
            return res.status(400).json({ msg: 'Cannot delete yourself' });
        }

        // hapus user
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        return res.status(200).json({ msg: 'User deleted successfully' });
    } 
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ msg: 'Failed to delete user' });
    }
}
module.exports = { getProfile, updateProfile, deleteAccount, getAllUsers, deleteUserById   }