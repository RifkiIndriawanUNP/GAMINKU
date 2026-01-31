const createRecentlyViewed = (item) => {
  let gameData;
  try {
    gameData = JSON.parse(item.game_data);
  } catch (error) {
    gameData = item.game_data;
  }
  
  return {
    id: item.id,
    user_id: item.user_id,
    game_id: item.game_id,
    game_data: gameData,
    viewed_at: item.viewed_at
  }
}

module.exports = createRecentlyViewed;