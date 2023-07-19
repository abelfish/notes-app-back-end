const noteModel = require('../models/noteModel');
const { ImageModel } = require('../models/imageModel');
const userModel = require('../models/userModel');
const fs = require('fs');
const AWS = require('aws-sdk');
const { SERVER_URL } = require('../config.json');

module.exports.getAllNotes = async (req, res, next) => {
  try {
    const { _id } = req.token;
    const results = await noteModel.find({ owner_id: _id });
    res.json({ success: true, results });
  } catch (e) {
    next(e);
  }
};
module.exports.getAllSharedNotes = async (req, res, next) => {
  console.log(req.token._id);
  try {
    const { _id } = req.token;
    const results = await noteModel.find({ sharedWith: _id });
    res.json({ success: true, results });
  } catch (e) {
    next(e);
  }
};

module.exports.addNewNote = async (req, res, next) => {
  try {
    const new_note = req.body;
    const { _id } = req.token;
    new_note.owner_id = _id;
    const results = await noteModel.create({ ...new_note });
    res.json({ success: true, results });
  } catch (e) {
    next(e);
  }
};
module.exports.getNoteById = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { _id } = req.token;
    const results = await noteModel.findOne({ owner_id: _id, _id: note_id });
    if (!results) {
      res.status(404).json({ success: false, results: 'Note not found' });
    } else {
      res.json({ success: true, results });
    }
  } catch (e) {
    next(e);
  }
};

module.exports.deleteNoteById = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { _id } = req.token;
    const results = await noteModel.deleteOne({ owner_id: _id, _id: note_id });
    if (!results) {
      res.status(404).json({ success: false, results: 'Note not found' });
    } else {
      res.json({ success: true, results });
    }
  } catch (e) {
    next(e);
  }
};
module.exports.updateSharedNoteById = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { _id } = req.token;
    const updated_note = req.body;

    const results = await noteModel.updateOne(
      { sharedWith: _id, _id: note_id },
      { $set: { ...updated_note } }
    );
    if (!results) {
      res.status(404).json({ success: false, results: 'Note not found' });
    } else {
      res.json({ success: true, results });
    }
  } catch (e) {
    next(e);
  }
};

module.exports.updateNoteById = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { _id } = req.token;
    const updated_note = req.body;
    const { images } = req.body;
    if (images) {
      const imagesPromises = images.map((image) => ImageModel.create(image));
      const imagesResults = await Promise.all(imagesPromises);
      new_note.images = imagesResults.map((image) => image._id);
    }
    const results = await noteModel.updateOne(
      { owner_id: _id, _id: note_id },
      { $set: { ...updated_note } }
    );

    if (!results) {
      res.status(404).json({ success: false, results: 'Note not found' });
    } else {
      res.json({ success: true, results });
    }
  } catch (e) {
    next(e);
  }
};
module.exports.shareNoteByEmail = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { email } = req.body;
    const search = await userModel.findOne({ email });
    if (!search) {
      res.status(404).json({ success: false, results: 'User not found' });
    } else {
      const user_id = search._id;
      const idExists = await noteModel.findOne({
        sharedWith: user_id,
        _id: note_id,
      });

      if (idExists) {
        res.status('404').send('Note already shared with this user');
      } else {
        const results = await noteModel.updateOne(
          { _id: note_id },
          { $push: { sharedWith: user_id } }
        );
        if (!results) {
          res.status(404).json({ success: false, results: 'Note not found' });
          return;
        }

        sendSQSMessage(email)
        res.json({ success: true, results });
      }
    }
  } catch (e) {
    next(e);
  }
};

module.exports.getSharedNoteById = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const { _id } = req.token;
    const results = await noteModel.findOne({ sharedWith: _id, _id: note_id });
    if (!results) {
      res.status(404).json({ success: false, results: 'Note not found' });
    } else {
      res.json({ success: true, results });
    }
  } catch (e) {
    next(e);
  }
};

module.exports.uploadImage = async (req, res, next) => {
  try {
    const { filename } = req;
    console.log(filename);

    // send back image url
    url = `http://${SERVER_URL}/api/notes/images/${filename}`;

    res.send({ link: url });
  } catch (e) {
    next(e);
  }
};

module.exports.getNoteImages = async (req, res, next) => {
  try {
    const { note_id } = req.params;
    const results = await noteModel.findOne(
      { _id: note_id },
      { images: 1, _id: 0 }
    );
    results.images.map((image) => res.sendFile(image, { root: './uploads' }));
  } catch (error) {
    next(error);
  }
};

module.exports.getNoteImageById = async (req, res, next) => {
  try {
    const { image_id } = req.params;
    res.sendFile(image_id, { root: './uploads' });
  } catch (error) {
    next(error);
  }
};

module.exports.deleteNoteImageById = async (req, res, next) => {
  try {
    //  delete image from uploads folder

    const { image_id } = req.params;
    fs.unlink(`./uploads/${image_id}`, (err) => {
      if (err) {
        res.status(400).json({ success: false, results: 'Image not found' });
      }
    });
  } catch (error) {
    next(error);
  }
};


const sendSQSMessage = async (email) => {
  AWS.config.update({ region: 'us-east-1' });

  // Create an SQS service object
  var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

  var params = {
    MessageBody: email,
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/419434614930/EmailQueue"
  };

  sqs.sendMessage(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
}
