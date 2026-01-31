const createFavorite = (favorite) => {
  let gameData;
  try {
    gameData = JSON.parse(favorite.game_data);
  } catch (error) {
    gameData = favorite.game_data; 
  }
  
  return {
    id: favorite.id,
    user_id: favorite.user_id,
    game_id: favorite.game_id,
    game_data: gameData,
    created_at: favorite.created_at
  }
}

module.exports = createFavorite;