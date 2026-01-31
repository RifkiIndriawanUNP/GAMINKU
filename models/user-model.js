const createUser = (user) => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user', 
        avatar_url: user.avatar_url,
        created_at: user.created_at
    }
}

module.exports = createUser