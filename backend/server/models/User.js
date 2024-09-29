const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true // Ensure the email is unique
  },
  password: {
    type: String,
    required: true
  },
  verificationToken: {
    type: String,
    required: false // Optional until a user registers
  },
  isVerified: {
    type: Boolean,
    default: false // Set to false until verified
  }
});

module.exports = mongoose.model('User', UserSchema);
