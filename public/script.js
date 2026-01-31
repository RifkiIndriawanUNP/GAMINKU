// CONFIG 
const API_BASE_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let currentSection = 'home';
let historyStack = [];
let currentGameDetails = null;

// INITIALIZE 
window.onload = () => {
    checkAuth();
    
    // Setup event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') searchGames();
        });
    }
    
    // Setup alphabet navigation
    setupAlphabetNavigation();
    
    // Set default home message
    showHomeDefault();
};

function setupAlphabetNavigation() {
    const alphabetGrid = document.getElementById('alphabetGrid');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    alphabetGrid.innerHTML = '';
    
    alphabet.forEach(letter => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'alphabet-letter';
        letterDiv.textContent = letter;
        letterDiv.onclick = () => loadAZGames(letter);
        alphabetGrid.appendChild(letterDiv);
    });
}

// NAVIGATION 
function showSection(sectionId) {
    if (currentSection !== sectionId) {
        historyStack.push(currentSection);
    }
    
    currentSection = sectionId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    window.scrollTo(0, 0);
    
    if (sectionId !== 'home') {
        hideSearchResults();
        document.getElementById('searchInput').value = '';
    }
    
    if (sectionId !== 'platforms') {
        document.getElementById('platformGamesSection').style.display = 'none';
    }
    
    if (sectionId === 'home') {
        showHomeDefault();
    }
}

function goBack() {
    if (historyStack.length > 0) {
        const prevSection = historyStack.pop();
        showSection(prevSection);
    } else {
        showSection('home');
    }
}

function showHomeDefault() {
    const searchResults = document.getElementById('searchResultsSection');
    const homeDefault = document.getElementById('homeDefaultMessage');
    
    if (!searchResults || searchResults.style.display === 'none') {
        if (homeDefault) homeDefault.style.display = 'block';
    }
}

// AUTH 
function checkAuth() {
    const loggedIn = !!token;
    document.getElementById('authButtons').style.display = loggedIn ? 'none' : 'flex';
    document.getElementById('userInfoNav').style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn) loadUserProfile();
}

async function apiRequest(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('API request failed:', error);
        return null;
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) return alert('Please fill all fields!');
    if (password.length < 6) return alert('Password must be at least 6 characters!');
    
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
    
    if (data) {
        alert('Registration successful! Please login.');
        hideModals();
        showModal('login');
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    } else {
        alert('Registration failed.');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) return alert('Please enter email and password!');
    
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (data?.token) {
        token = data.token;
        localStorage.setItem('token', token);
        currentUser = data.user;
        hideModals();
        checkAuth();
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        if (currentSection === 'profile') loadProfileData();
        alert('Login successful!');
    } else {
        alert('Login failed.');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        token = null;
        currentUser = null;
        localStorage.removeItem('token');
        checkAuth();
        showSection('home');
    }
}

// GAMES 
async function loadGames(type) {
    const endpoints = {
        'popular': '/games/popular',
        'highest-rated': '/games/highest-rated',
        'upcoming': '/games/upcoming'
    };
    
    document.getElementById('gamesLoading').classList.add('active');
    const titles = {
        'popular': 'Popular Games',
        'highest-rated': 'Highest Rated Games',
        'upcoming': 'Upcoming Games'
    };
    document.getElementById('gamesTitle').textContent = titles[type] || 'Games';
    
    const data = await apiRequest(endpoints[type]);
    const container = document.getElementById('gamesGrid');
    
    if (data?.results?.length) {
        displayGames(data.results, container);
    } else {
        container.innerHTML = '<p class="no-data active">Failed to load games.</p>';
    }
    
    document.getElementById('gamesLoading').classList.remove('active');
    showSection('games');
}

async function searchGames() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return alert('Please enter a search term!');
    
    document.getElementById('searchLoading').classList.add('active');
    document.getElementById('homeDefaultMessage').style.display = 'none';
    document.getElementById('searchResultsSection').style.display = 'block';
    
    const data = await apiRequest(`/games/search?search=${encodeURIComponent(query)}`);
    const container = document.getElementById('searchResultsGrid');
    
    if (data?.results?.length) {
        displayGames(data.results, container);
        document.getElementById('searchResultsTitle').textContent = `Search Results: "${query}"`;
    } else {
        container.innerHTML = '<p class="no-data active">No games found.</p>';
        document.getElementById('searchResultsTitle').textContent = `Search Results: "${query}"`;
    }
    
    document.getElementById('searchLoading').classList.remove('active');
}

function clearSearch() {
    hideSearchResults();
    document.getElementById('searchInput').value = '';
    showHomeDefault();
}

function hideSearchResults() {
    document.getElementById('searchResultsSection').style.display = 'none';
    document.getElementById('searchResultsGrid').innerHTML = '';
}

// A-Z GAMES 
async function loadAZGames(letter) {
    if (!letter || !letter.match(/^[A-Z]$/)) letter = 'A';
    
    document.querySelectorAll('.alphabet-letter').forEach(el => {
        el.classList.remove('active');
        if (el.textContent === letter) el.classList.add('active');
    });
    
    const selectedLetterInfo = document.querySelector('.selected-letter-info');
    if (selectedLetterInfo) {
        selectedLetterInfo.innerHTML = `<h3>Games starting with "${letter}"</h3><p>Loading...</p>`;
    }
    
    document.getElementById('azGamesLoading').classList.add('active');
    document.getElementById('noAZGames').style.display = 'none';
    const container = document.getElementById('azGamesList');
    container.innerHTML = '';
    
    try {
        const data = await apiRequest(`/games/a-z/${letter}`);
        document.getElementById('azGamesLoading').classList.remove('active');
        
        if (data?.success && data?.results?.length > 0) {
            displayAZGames(data.results, container);
            if (selectedLetterInfo) {
                selectedLetterInfo.innerHTML = `<h3>Games starting with "${letter}"</h3><p>${data.results.length} games</p>`;
            }
        } else {
            document.getElementById('noAZGames').textContent = data?.message || `No games found starting with "${letter}"`;
            document.getElementById('noAZGames').style.display = 'block';
            if (selectedLetterInfo) {
                selectedLetterInfo.innerHTML = `<h3>Games starting with "${letter}"</h3><p>0 games</p>`;
            }
        }
    } catch (error) {
        document.getElementById('azGamesLoading').classList.remove('active');
        document.getElementById('noAZGames').textContent = 'Error loading games.';
        document.getElementById('noAZGames').style.display = 'block';
    }
    
    showSection('az-games');
}

function displayAZGames(games, container) {
    const template = document.getElementById('azGameItemTemplate');
    container.innerHTML = '';
    
    games.forEach(game => {
        const clone = template.content.cloneNode(true);
        const title = clone.querySelector('.az-game-title');
        const viewBtn = clone.querySelector('.view-game-btn');
        const item = clone.querySelector('.az-game-item');
        
        title.textContent = game.name;
        
        viewBtn.onclick = (e) => {
            e.stopPropagation();
            viewGameDetails(game.name);
        };
        
        item.onclick = () => viewGameDetails(game.name);
        
        container.appendChild(clone);
    });
}

// PLATFORM GAMES 
async function loadPlatformGames(platform) {
    document.getElementById('platformLoading').classList.add('active');
    
    const data = await apiRequest(`/games/${platform}`);
    const container = document.getElementById('platformGamesGrid');
    
    if (data?.results?.length) {
        displayGames(data.results, container);
        document.getElementById('platformTitle').textContent = data.platform || `${platform} Games`;
        document.getElementById('platformGamesSection').style.display = 'block';
        document.getElementById('platformGamesSection').scrollIntoView({ behavior: 'smooth' });
    } else {
        container.innerHTML = '<p class="no-data active">No games found.</p>';
    }
    
    document.getElementById('platformLoading').classList.remove('active');
}

// GAME DETAILS 
async function viewGameDetails(gameName) {
    if (!gameName) return;
    
    showSection('game-details');
    const container = document.querySelector('.game-details-container');
    container.innerHTML = '<div class="spinner active" style="margin: 4rem auto;"></div>';
    
    const encodedName = encodeURIComponent(gameName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-'));
    const data = await apiRequest(`/games/${encodedName}`);
    
    if (data) {
        currentGameDetails = data;
        displayGameDetails(data);
        if (token) addRecentlyViewed(data.id, data);
    } else {
        container.innerHTML = `
            <div class="game-details-content">
                <div class="game-back-button">
                    <button class="btn btn-secondary" onclick="goBack()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
                <p class="no-data active" style="padding: 4rem; text-align: center;">
                    Failed to load game details.
                </p>
            </div>
        `;
    }
}

function displayGameDetails(game) {
    const template = document.getElementById('gameDetailsTemplate');
    const clone = template.content.cloneNode(true);
    const container = document.querySelector('.game-details-container');
    
    container.innerHTML = '';
    container.appendChild(clone);
    
    const heroImage = document.getElementById('gameHeroImage');
    heroImage.src = game.background_image || 'https://via.placeholder.com/400x225?text=No+Image';
    heroImage.alt = game.name;
    
    document.getElementById('gameDetailTitle').textContent = game.name;
    document.getElementById('gameDetailRating').textContent = game.rating || 'N/A';
    document.getElementById('gameReleaseDate').textContent = game.released || 'TBA';
    document.getElementById('gamePlaytime').textContent = game.playtime || 'N/A';
    document.getElementById('gameEsrb').textContent = game.esrb_rating || 'Not Rated';
    
    const descriptionEl = document.getElementById('gameDescription');
    descriptionEl.textContent = game.description || 'No description available.';
    
    // Simple text display for platforms, genres, developers, publishers
    document.getElementById('gamePlatformsSimple').textContent = 
        game.platforms?.map(p => p.platform.name).join(', ') || 'Not available';
    document.getElementById('gameGenresSimple').textContent = 
        game.genres?.map(g => g.name).join(', ') || 'Not available';
    document.getElementById('gameDevelopersSimple').textContent = 
        game.developers?.map(d => d.name).join(', ') || 'Not available';
    document.getElementById('gamePublishersSimple').textContent = 
        game.publishers?.map(p => p.name).join(', ') || 'Not available';
    
    const screenshotsEl = document.getElementById('gameScreenshots');
    const screenshotsSection = document.getElementById('screenshotsSection');
    if (game.screenshots?.length) {
        screenshotsEl.innerHTML = game.screenshots.map(s => `
            <div class="screenshot-item">
                <img src="${s.image}" alt="Game Screenshot" loading="lazy">
            </div>
        `).join('');
        screenshotsSection.style.display = 'block';
    } else {
        screenshotsSection.style.display = 'none';
    }
    
    const favoriteBtn = document.getElementById('gameFavoriteBtn');
    const wishlistBtn = document.getElementById('gameWishlistBtn');
    
    favoriteBtn.onclick = (e) => {
        e.stopPropagation();
        if (!token) showModal('login');
        else addToFavorites(game.id, game);
    };
    
    wishlistBtn.onclick = (e) => {
        e.stopPropagation();
        if (!token) showModal('login');
        else addToWishlist(game.id, game);
    };
    
    updateFavoriteWishlistButtons(game.id);
}

function displayGames(games, container) {
    const template = document.getElementById('gameCardTemplate');
    container.innerHTML = '';
    
    games.forEach(game => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.game-card');
        const img = clone.querySelector('.game-image');
        const title = clone.querySelector('.game-title');
        const rating = clone.querySelector('.rating-value');
        const date = clone.querySelector('.release-date');
        const favBtn = clone.querySelector('.favorite-btn');
        const wishBtn = clone.querySelector('.wishlist-btn');
        
        img.src = game.background_image || 'https://via.placeholder.com/400x225?text=No+Image';
        img.alt = game.name;
        title.textContent = game.name;
        rating.textContent = game.rating || 'N/A';
        date.textContent = game.released || 'TBA';
        
        card.onclick = () => viewGameDetails(game.name);
        favBtn.onclick = (e) => {
            e.stopPropagation();
            if (!token) showModal('login');
            else addToFavorites(game.id, game);
        };
        wishBtn.onclick = (e) => {
            e.stopPropagation();
            if (!token) showModal('login');
            else addToWishlist(game.id, game);
        };
        
        container.appendChild(clone);
    });
}

// PROFILE 
async function loadUserProfile() {
    if (!token) return;
    
    try {
        const user = await apiRequest('/users/profile');
        if (user) {
            currentUser = user;
            
            document.getElementById('navUsername').textContent = user.username;
            document.getElementById('navAvatar').src = user.avatar_url || 'https://i.pravatar.cc/150';
            document.getElementById('profileUsername').textContent = user.username;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileAvatar').src = user.avatar_url || 'https://i.pravatar.cc/150';
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editAvatar').value = user.avatar_url || '';
            document.getElementById('profileJoinDate').textContent = new Date(user.created_at).toLocaleDateString('id-ID');
            
            const adminTabBtn = document.getElementById('adminTabBtn');
            if (adminTabBtn) {
                try {
                    const tokenData = parseJwt(token);
                    const isAdmin = (tokenData?.role === 'admin') || (user.role === 'admin');
                    adminTabBtn.style.display = isAdmin ? 'block' : 'none';
                } catch (error) {
                    adminTabBtn.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

async function updateProfile() {
    if (!token) return;
    
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const avatar_url = document.getElementById('editAvatar').value.trim();
    
    if (!username || !email) return alert('Username and email required!');
    
    const data = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username, email, avatar_url })
    });
    
    if (data) {
        alert('Profile updated!');
        loadUserProfile();
    } else {
        alert('Failed to update profile.');
    }
}

async function deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone!')) return;
    
    const success = await apiRequest('/users/profile', { method: 'DELETE' });
    
    if (success) {
        alert('Account deleted!');
        logout();
    } else {
        alert('Failed to delete account.');
    }
}

// FAVORITES & WISHLIST 
async function addToFavorites(gameId, gameData) {
    if (!token) return showModal('login');
    
    const data = await apiRequest('/games/favorites', {
        method: 'POST',
        body: JSON.stringify({ gameId, gameData })
    });
    
    if (data) {
        alert('Added to favorites!');
        if (currentGameDetails && currentGameDetails.id === gameId) {
            updateFavoriteWishlistButtons(gameId);
        }
        if (document.getElementById('favoritesTab').classList.contains('active')) {
            loadFavorites();
        }
    } else {
        alert('Failed to add to favorites.');
    }
}

async function addToWishlist(gameId, gameData) {
    if (!token) return showModal('login');
    
    const data = await apiRequest('/games/wishlist', {
        method: 'POST',
        body: JSON.stringify({ gameId, gameData })
    });
    
    if (data) {
        alert('Added to wishlist!');
        if (currentGameDetails && currentGameDetails.id === gameId) {
            updateFavoriteWishlistButtons(gameId);
        }
        if (document.getElementById('wishlistTab').classList.contains('active')) {
            loadWishlist();
        }
    } else {
        alert('Failed to add to wishlist.');
    }
}

async function updateFavoriteWishlistButtons(gameId) {
    const favoritesData = await apiRequest('/games/favorites/list');
    const isFavorite = favoritesData?.favorites?.some(fav => fav.game_id === gameId);
    
    const wishlistData = await apiRequest('/games/wishlist/list');
    const isInWishlist = wishlistData?.wishlist?.some(wish => wish.game_id === gameId);
    
    const favoriteBtn = document.getElementById('gameFavoriteBtn');
    const wishlistBtn = document.getElementById('gameWishlistBtn');
    
    if (favoriteBtn) {
        if (isFavorite) {
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
            favoriteBtn.classList.add('btn-danger');
            favoriteBtn.classList.remove('btn-primary');
            favoriteBtn.onclick = () => removeFavorite(gameId);
        } else {
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
            favoriteBtn.classList.remove('btn-danger');
            favoriteBtn.classList.add('btn-primary');
            favoriteBtn.onclick = () => addToFavorites(gameId, currentGameDetails);
        }
    }
    
    if (wishlistBtn) {
        if (isInWishlist) {
            wishlistBtn.innerHTML = '<i class="fas fa-star"></i> Remove from Wishlist';
            wishlistBtn.classList.add('btn-danger');
            wishlistBtn.classList.remove('btn-secondary');
            wishlistBtn.onclick = () => removeWishlist(gameId);
        } else {
            wishlistBtn.innerHTML = '<i class="fas fa-star"></i> Add to Wishlist';
            wishlistBtn.classList.remove('btn-danger');
            wishlistBtn.classList.add('btn-secondary');
            wishlistBtn.onclick = () => addToWishlist(gameId, currentGameDetails);
        }
    }
}

async function loadFavorites() {
    if (!token) return;
    const data = await apiRequest('/games/favorites/list');
    displayProfileGames(data?.favorites || [], 'favoritesList', 'noFavorites', 'favorite');
}

async function loadWishlist() {
    if (!token) return;
    const data = await apiRequest('/games/wishlist/list');
    displayProfileGames(data?.wishlist || [], 'wishlistList', 'noWishlist', 'wishlist');
}

async function removeFavorite(gameId) {
    if (!confirm('Remove from favorites?')) return;
    
    const success = await apiRequest(`/games/favorites/${gameId}`, { method: 'DELETE' });
    
    if (success) {
        alert('Removed!');
        if (currentGameDetails && currentGameDetails.id === gameId) {
            updateFavoriteWishlistButtons(gameId);
        }
        loadFavorites();
    } else {
        alert('Failed to remove.');
    }
}

async function removeWishlist(gameId) {
    if (!confirm('Remove from wishlist?')) return;
    
    const success = await apiRequest(`/games/wishlist/${gameId}`, { method: 'DELETE' });
    
    if (success) {
        alert('Removed!');
        if (currentGameDetails && currentGameDetails.id === gameId) {
            updateFavoriteWishlistButtons(gameId);
        }
        loadWishlist();
    } else {
        alert('Failed to remove.');
    }
}

// RECENTLY VIEWED 
async function addRecentlyViewed(gameId, gameData) {
    if (!token) return;
    await apiRequest('/games/recently-viewed', {
        method: 'POST',
        body: JSON.stringify({ gameId, gameData })
    });
}

async function loadRecentlyViewed() {
    if (!token) return;
    const data = await apiRequest('/games/recently-viewed/list');
    displayRecentlyViewedGames(data?.recently_viewed || [], 'recentlyViewedList', 'noRecentlyViewed');
}

async function clearRecentlyViewed() {
    if (!confirm('Clear all recently viewed games?')) return;
    
    const success = await apiRequest('/games/recently-viewed/clear', { method: 'DELETE' });
    
    if (success) {
        alert('Cleared!');
        loadRecentlyViewed();
    } else {
        alert('Failed to clear.');
    }
}

function displayRecentlyViewedGames(items, containerId, noDataId) {
    const container = document.getElementById(containerId);
    const noData = document.getElementById(noDataId);
    const template = document.getElementById('recentlyViewedCardTemplate');
    
    if (!items.length) {
        container.innerHTML = '';
        noData.classList.add('active');
        return;
    }
    
    container.innerHTML = '';
    noData.classList.remove('active');
    
    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.game-card');
        const img = clone.querySelector('.game-image');
        const title = clone.querySelector('.game-title');
        const rating = clone.querySelector('.rating-value');
        const viewedTime = clone.querySelector('.viewed-time');
        
        const game = item.game_data;
        img.src = game.background_image || 'https://via.placeholder.com/400x225?text=No+Image';
        img.alt = game.name;
        title.textContent = game.name;
        rating.textContent = game.rating || 'N/A';
        
        if (item.viewed_at) {
            const viewedDate = new Date(item.viewed_at);
            viewedTime.textContent = viewedDate.toLocaleString();
        } else {
            viewedTime.textContent = 'Just now';
        }
        
        card.onclick = () => viewGameDetails(game.name);
        
        container.appendChild(clone);
    });
}

function displayProfileGames(items, containerId, noDataId, type) {
    const container = document.getElementById(containerId);
    const noData = document.getElementById(noDataId);
    const template = document.getElementById('profileGameCardTemplate');
    
    if (!items.length) {
        container.innerHTML = '';
        noData.classList.add('active');
        return;
    }
    
    container.innerHTML = '';
    noData.classList.remove('active');
    
    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.game-card');
        const img = clone.querySelector('.game-image');
        const title = clone.querySelector('.game-title');
        const rating = clone.querySelector('.rating-value');
        const removeBtn = clone.querySelector('.remove-btn');
        
        const game = item.game_data;
        img.src = game.background_image || 'https://via.placeholder.com/400x225?text=No+Image';
        img.alt = game.name;
        title.textContent = game.name;
        rating.textContent = game.rating || 'N/A';
        
        card.onclick = () => viewGameDetails(game.name);
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (type === 'favorite') removeFavorite(game.id);
            else if (type === 'wishlist') removeWishlist(game.id);
        };
        
        container.appendChild(clone);
    });
}

// PROFILE TABS 
function showProfileTab(tabId) {
    document.querySelectorAll('.profile-tab-content').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const tabElement = document.getElementById(tabId + 'Tab');
    const buttonElement = event?.target?.closest('.tab-btn');
    
    if (tabElement) {
        tabElement.classList.add('active');
        tabElement.style.display = 'block';
    }
    
    if (buttonElement) buttonElement.classList.add('active');
    
    if (tabId === 'favorites') loadFavorites();
    else if (tabId === 'wishlist') loadWishlist();
    else if (tabId === 'recentlyViewed') loadRecentlyViewed();
    else if (tabId === 'admin') loadAllUsers();
}

function loadProfileData() {
    if (!token) return;
    loadUserProfile();
    loadFavorites();
}

// ADMIN FUNCTIONS 
async function loadAllUsers() {
    try {
        const data = await apiRequest('/users/all');
        if (data?.users) displayUsersTable(data.users);
        else showProfileTab('favorites');
    } catch (error) {
        showProfileTab('favorites');
    }
}

function displayUsersTable(users) {
    const adminTab = document.getElementById('adminTab');
    adminTab.innerHTML = `
        <div class="admin-header">
            <h3>Admin Dashboard</h3>
        </div>
        <div class="users-table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody"></tbody>
            </table>
        </div>
    `;
    
    const usersTableBody = document.getElementById('usersTableBody');
    
    users.forEach(user => {
        const joinDate = new Date(user.created_at).toLocaleDateString('id-ID');
        const isCurrentUser = currentUser && user.id === currentUser.id;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${user.avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGN3Vwe3NgJyaHYvWbXD4XuNamFYkhsX_gcw&s'}" 
                         style="width:30px;height:30px;border-radius:50%;object-fit:cover;">
                    ${user.username} ${isCurrentUser ? '<span style="color:#6c5ce7;">(You)</span>' : ''}
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${joinDate}</td>
            <td>
                ${!isCurrentUser && user.role !== 'admin' ? `
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')">
                        <i class="fas fa-ban"></i> Ban
                    </button>
                ` : '<span style="color:#b2bec3;font-style:italic;">Not allowed</span>'}
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

async function deleteUser(userId, username) {
    if (!confirm(`Delete user "${username}" (ID: ${userId})?`)) return;
    
    try {
        const success = await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        if (success) {
            alert(`User "${username}" deleted.`);
            loadAllUsers();
        } else {
            alert('Failed to delete user.');
        }
    } catch (error) {
        alert('Error deleting user.');
    }
}

// MODALS 
function showModal(modalId) {
    hideModals();
    document.getElementById(modalId + 'Modal').classList.add('active');
}

function hideModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// LISTENERS 
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) hideModals();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModals();
});