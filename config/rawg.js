const axios = require('axios')

const rawg = axios.create({
    baseURL: 'https://api.rawg.io/api',
    timeout: 10000
})

module.exports = rawg