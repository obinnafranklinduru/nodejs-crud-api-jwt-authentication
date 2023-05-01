const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 3600 // token expires in 1 hour
  }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;