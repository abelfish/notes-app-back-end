const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  module.exports.ImageSchema= ImageSchema;
  module.exports.ImageModel= mongoose.model("Image", ImageSchema);