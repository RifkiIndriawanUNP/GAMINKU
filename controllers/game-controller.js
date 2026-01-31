const { pool } = require('../config/database');
const rawg = require('../config/rawg');
const logger = require('../middlewares/logger');
const { getCachedData } = require('../config/cache');
const createGame = require('../models/game-model');

// Search games
const searchGames = async (req, res) => {
    const search = req.query.search;
    const page = req.query.page || 1;
    
    if (!search) {
        logger.warn('Search query missing');
        return res.status(400).json({ msg: 'Search query required!' });
    }
    
    try {
        logger.info(`Searching games: ${search}, page: ${page}`);
        
        const response = await rawg.get('/games', {
            params: {
                key: process.env.RAWG_API_KEY,
                search: search,
                page: page,
                page_size: 50
            }
        });
        
        const games = response.data.results.map(createGame);
        
        logger.info(`Search completed: ${games.length} games found`);
        
        return res.status(200).json({
            count: response.data.count,
            results: games
        });
    } 
    catch (error) {
        logger.error('Search games error:', error.message);
        return res.status(500).json({ msg: 'Failed to search games' });
    }
}

// Popular Games
const getPopularGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'popular_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        ordering: '-metacritic,-rating',
                        page_size: 50,
                        metacritic: '80,100'
                    }
                });
                return response.data.results.map(createGame);
            },
            600 // 10 menit cache
        );
        
        logger.info(`Popular games loaded: ${games.length} games`);
        return res.status(200).json({ 
            category: 'Popular Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Popular games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch popular games' });
    }
}

// Highest Rated Games
const getHighestRatedGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'highest_rated_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        ordering: '-rating',
                        page_size: 50,
                        rating: '4.0,5.0'
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`Highest rated games loaded: ${games.length} games`);
        return res.status(200).json({ 
            category: 'Highest Rated Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Highest rated games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch highest rated games' });
    }
}

// Upcoming Games
const getUpcomingGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'upcoming_games',
            async () => {
                const currentDate = new Date().toISOString().split('T')[0];
                const futureDate = new Date();
                futureDate.setFullYear(futureDate.getFullYear() + 2);
                
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        dates: `${currentDate},${futureDate.toISOString().split('T')[0]}`,
                        ordering: 'released',
                        page_size: 50,
                        exclude_additions: true
                    }
                });
                
                return response.data.results
                    .filter(game => {
                        if (!game.released) return true;
                        const releaseDate = new Date(game.released);
                        const now = new Date();
                        return releaseDate > now;
                    })
                    .map(createGame);
            },
            300 // 5 menit cache untuk upcoming
        );
        
        logger.info(`Upcoming games loaded: ${games.length} games`);
        return res.status(200).json({ 
            category: 'Upcoming Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Upcoming games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch upcoming games' });
    }
}

// Game Details by Name/Slug
const getGameDetailsByName = async (req, res) => {
    const { name } = req.params;
    
    if (!name) {
        return res.status(400).json({ msg: 'Game name required!' });
    }
    
    try {
        logger.info(`Fetching game details for: ${name}`);
        
        const gameDetails = await getCachedData(
            `game_details_${name}`,
            async () => {
                // Convert name to slug format
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                // Get game by slug
                const gameResponse = await rawg.get(`/games/${slug}`, {
                    params: { 
                        key: process.env.RAWG_API_KEY 
                    }
                });
                
                // Get screenshots
                const screenshotsResponse = await rawg.get(`/games/${slug}/screenshots`, {
                    params: { key: process.env.RAWG_API_KEY }
                });
                
                // Get series if available
                let series = [];
                try {
                    const seriesResponse = await rawg.get(`/games/${slug}/game-series`, {
                        params: { key: process.env.RAWG_API_KEY }
                    });
                    series = seriesResponse.data.results || [];
                } catch (error) {
                    logger.warn(`No series data for ${name}`);
                }
                
                const game = gameResponse.data;
                
                return {
                    id: game.id,
                    name: game.name,
                    slug: game.slug,
                    description: game.description_raw || game.description || 'No description available.',
                    released: game.released,
                    background_image: game.background_image,
                    rating: game.rating,
                    rating_top: game.rating_top,
                    playtime: game.playtime,
                    esrb_rating: game.esrb_rating?.name || 'Not Rated',
                    platforms: game.platforms?.map(p => ({
                        platform: { 
                            id: p.platform.id, 
                            name: p.platform.name,
                            slug: p.platform.slug 
                        }
                    })) || [],
                    genres: game.genres?.map(g => ({
                        id: g.id,
                        name: g.name,
                        slug: g.slug
                    })) || [],
                    developers: game.developers?.map(d => ({
                        id: d.id,
                        name: d.name,
                        slug: d.slug
                    })) || [],
                    publishers: game.publishers?.map(p => ({
                        id: p.id,
                        name: p.name,
                        slug: p.slug
                    })) || [],
                    tags: game.tags?.map(t => ({
                        id: t.id,
                        name: t.name,
                        slug: t.slug
                    })) || [],
                    screenshots: screenshotsResponse.data.results?.map(s => ({
                        id: s.id,
                        image: s.image
                    })) || [],
                    series: series.map(s => ({
                        id: s.id,
                        name: s.name,
                        slug: s.slug
                    })),
                    stores: game.stores?.map(s => ({
                        id: s.id,
                        store: {
                            id: s.store.id,
                            name: s.store.name,
                            domain: s.store.domain
                        }
                    })) || []
                };
            },
            3600 // 1 jam cache untuk game details
        );
        
        if (!gameDetails) {
            logger.warn(`Game not found: ${name}`);
            return res.status(404).json({ msg: 'Game not found' });
        }
        
        logger.info(`Game details loaded: ${gameDetails.name}`);
        return res.status(200).json(gameDetails);
    } 
    catch (error) {
        logger.error('Game details error:', error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ msg: 'Game not found' });
        }
        
        return res.status(500).json({ msg: 'Failed to fetch game details' });
    }
}

// Games A-Z berdasarkan huruf pertama
const getGamesAZ = async (req, res) => {
    const letter = req.params.letter?.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) {
        return res.status(400).json({ success: false });
    }

    try {
        let results = [];
        let page = 1;
        const MAX_PAGES = 20; // Kurangi biar lebih cepat

        // Pattern untuk mencari game yang dimulai dengan huruf (abaikan karakter khusus)
        const startsWithLetter = (gameName) => {
            if (!gameName) return false;
            
            // Bersihkan karakter non-alfabet di awal
            const cleanName = gameName.replace(/^[^A-Za-z0-9]+/, '').trim();
            const firstChar = cleanName[0]?.toUpperCase();
            
            return firstChar === letter;
        };

        while (results.length < 50 && page <= MAX_PAGES) {
            try {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        page: page,
                        page_size: 40, // Naikkan ke 40 untuk efisiensi
                        ordering: '-rating' // Rating tertinggi dulu
                    }
                });

                const games = response.data.results || [];
                const filtered = games.filter(game => startsWithLetter(game.name));
                results.push(...filtered);
                
                if (games.length < 40) break; // Sudah habis data
                page++;
                
            } catch (error) {
                console.error(`Error page ${page}:`, error.message);
                break;
            }
        }

        // Hapus duplikat berdasarkan ID
        const uniqueResults = [...new Map(results.map(game => [game.id, game])).values()]
            .slice(0, 50);

        return res.status(200).json({
            success: true,
            letter,
            count: uniqueResults.length,
            results: uniqueResults
        });

    } catch (err) {
        console.error('AZ ERROR:', err.message);
        return res.status(500).json({ success: false });
    }
};




// Platform Games (with cache)
const getPCGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'pc_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        platforms: 4,
                        ordering: '-rating',
                        page_size: 50
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`PC games loaded: ${games.length} games`);
        return res.status(200).json({ 
            platform: 'PC Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('PC games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch PC games' });
    }
}

const getPlayStationGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'playstation_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        platforms: '18,16,15',
                        ordering: '-rating',
                        page_size: 50
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`PlayStation games loaded: ${games.length} games`);
        return res.status(200).json({ 
            platform: 'PlayStation Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('PlayStation games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch PlayStation games' });
    }
}

const getXboxGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'xbox_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        platforms: '1,186,14',
                        ordering: '-rating',
                        page_size: 50
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`Xbox games loaded: ${games.length} games`);
        return res.status(200).json({ 
            platform: 'Xbox Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Xbox games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch Xbox games' });
    }
}

const getNintendoGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'nintendo_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        platforms: '7,8,9',
                        ordering: '-rating',
                        page_size: 50
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`Nintendo games loaded: ${games.length} games`);
        return res.status(200).json({ 
            platform: 'Nintendo Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Nintendo games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch Nintendo games' });
    }
}

const getMobileGames = async (req, res) => {
    try {
        const games = await getCachedData(
            'mobile_games',
            async () => {
                const response = await rawg.get('/games', {
                    params: {
                        key: process.env.RAWG_API_KEY,
                        platforms: '3,21',
                        ordering: '-rating',
                        page_size: 50
                    }
                });
                return response.data.results.map(createGame);
            },
            600
        );
        
        logger.info(`Mobile games loaded: ${games.length} games`);
        return res.status(200).json({ 
            platform: 'Mobile Games',
            results: games 
        });
    } 
    catch (error) {
        logger.error('Mobile games error:', error.message);
        return res.status(500).json({ msg: 'Failed to fetch mobile games' });
    }
}


module.exports = { 
    searchGames, 
    getPopularGames,
    getHighestRatedGames,
    getUpcomingGames,
    getGameDetailsByName,
    getGamesAZ,
    getPCGames,
    getPlayStationGames,
    getXboxGames,
    getNintendoGames,
    getMobileGames
};