const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PostSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  user:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
  public:
  {
    type: Boolean,
    require :false,
    default: false
  }
},{timestamps:true});

module.exports = mongoose.model('Post', PostSchema);