const createGame = (game) => {
    return {
        id: game.id,
        name: game.name,
        released: game.released,
        background_image: game.background_image,
        rating: game.rating,
        rating_top: game.rating_top,
        metacritic: game.metacritic,
        platforms: game.platforms ? game.platforms.map(p => ({
            platform: { id: p.platform.id, name: p.platform.name }
        })) : []
    }
}

module.exports = createGame