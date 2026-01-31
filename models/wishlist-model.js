const createWishlist = (wishlist) => {
  let gameData;
  try {
    gameData = JSON.parse(wishlist.game_data);
  } catch (error) {
    gameData = wishlist.game_data;
  }
  
  return {
    id: wishlist.id,
    user_id: wishlist.user_id,
    game_id: wishlist.game_id,
    game_data: gameData,
    created_at: wishlist.created_at
  }
}

module.exports = createWishlist;