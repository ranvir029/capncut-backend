const mongoose = require('mongoose');

const UserModel = mongoose.Schema({
  userName: {
    type: String,
    required: false, // Google login users may not have username initially
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
   socialLinks: {
          type: [String],
          default: [],
     },
  password: {
    type: String,
    required: false, // not required for Google login
  },
  googleId: {
    type: String,
    required: false, // will be set for Google login users
    unique: true,
    sparse: true, // allows multiple docs with null googleId
  },
  profilePic: {
    type: String, // optional, from Google profile
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserData", UserModel);
