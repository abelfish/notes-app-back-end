const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ImageSchema } = require('./imageModel');
const  userModel  = require('./userModel');
const NoteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      // required: true,
    },
   
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'userModel',
      required: true,
    },
    sharedWith: [
      {
        type: Schema.Types.ObjectId,
        ref: 'userModel',
      },
    ],
    images: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
