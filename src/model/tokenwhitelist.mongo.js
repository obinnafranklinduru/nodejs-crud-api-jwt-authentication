const mongoose = require('mongoose');

const tokenWhitelistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
});

const TokenWhitelist = mongoose.model('TokenWhitelist', tokenWhitelistSchema);

module.exports = TokenWhitelist;