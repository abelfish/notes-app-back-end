const express = require('express');
const multer = require('multer');

const {
  updateSharedNoteById,
  getNoteImages,
  deleteNoteImageById,
  getNoteImageById,
  uploadImage,
  shareNoteByEmail,
  getAllSharedNotes,
  getSharedNoteById,
  getAllNotes,
  addNewNote,
  getNoteById,
  deleteNoteById,
  updateNoteById,
} = require('../controllers/noteController');

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype != 'image/jpeg') {
      return cb(new Error('Wrong file type'));
    }
    cb(null, true);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
    req.filename = file.fieldname + '-' + uniqueSuffix + '.jpg';
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', getAllNotes);
router.post('/', addNewNote);
router.delete('/images/:image_id', deleteNoteImageById);
router.get('/shared', getAllSharedNotes);
router.get('/shared/:note_id', getSharedNoteById);
router.get('/images/:image_id', getNoteImageById);
router.get('/:note_id', getNoteById);
router.delete('/:note_id', deleteNoteById);
router.put('/:note_id', updateNoteById);
router.put('/:note_id/share', shareNoteByEmail);
router.put('/shared/:note_id', updateSharedNoteById);
router.post('/images/', upload.single('image'), uploadImage);

module.exports = router;
