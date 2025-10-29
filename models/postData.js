const mongoose = require('mongoose');
const PostModel = new mongoose.Schema({
     title: {
          required: false,
          type: String
     },
     Description: {
          required: true,
          type: String
     },
     image: {
          type: String
     },
     likes: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserData'
     }],
    
     replies: [{
          text: {
               type: String,
               required: true
          },
          user: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'UserData'
          },
          createdAt: { type: Date, default: Date.now },
     }],
     user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserData',
     },
})

module.exports = mongoose.model("PostData", PostModel);