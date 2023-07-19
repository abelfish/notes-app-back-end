const brcypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../config.json');
const { SUGAR } = require('../config.json');


module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user_db = await userModel.findOne({ email: email });
    const match = await brcypt.compare(password, user_db.password);
    if (user_db) {
      if (!match) {
        res
          .status(404)
          .json({ success: false, results: 'Email or Password is incorrect' });
      } else {
        const token = jwt.sign(
          {
            _id: user_db._id,
            fullname: user_db.fullname,
            email: user_db.email,
          },
          SECRET
        );
        res.json({ success: true, results: token });
      }
    } else {
      res
        .status(404)
        .json({ success: false, results: 'Email or Password is incorrect' });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
module.exports.signup = async (req, res, next) => {

  try {
    const newUser = req.body;
    // check if email already exists
    const emailResults = await userModel.findOne({ email: newUser.email });
    console.log(emailResults);
    if (emailResults) {
      res.status(404).json({ success: false, results: 'Email already exists' });
    } else {
      const hashed_password = await brcypt.hash(newUser.password, 10);
      const results = await userModel.create({
        ...newUser,
        password: hashed_password,
      });



      res.json({ success: true, results: results });
    }
  } catch (error) {
    next(error);
  }

};
