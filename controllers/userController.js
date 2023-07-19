const brcypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../config.json');
const { SUGAR } = require('../config.json');
const AWS = require('aws-sdk');




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

      // publish email
      publishEmail(newUser.email);

      res.json({ success: true, results: results });
    }
  } catch (error) {
    next(error);
  }

};

const publishEmail = async (email) => {
  //configure AWS
  AWS.config.update({ region: 'us-east-1' });
  //configure sns
  const params = {
    Message: email, /* required */
    TopicArn: 'arn:aws:sns:us-east-1:419434614930:SignupTopic'
  };

  // Create promise and SNS service object
  const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

  // Handle promise's fulfilled/rejected states
  publishTextPromise.then(
    function (data) {
      console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
      console.log("MessageID is " + data.MessageId);
    }).catch(
      function (err) {
        console.error(err, err.stack);
      });
}