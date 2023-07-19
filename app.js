const express = require('express');

const userRouter = require('./routers/userRouter');
const morgan = require('morgan');
const PORT = process.env.PORT || 80;
const cors = require('cors');
const { checkToken } = require('./middlewares/checkToken');
const app = express();
const mongoose = require('mongoose');
const { DB_SERVER } = require('./config.json');
const noteRouter = require('./routers/noteRouter');
const AWS = require('aws-sdk');

// Configure AWS credentials and region
AWS.config.update({
  region: 'us-east-1'
});

// Mongoose
// connect to database
mongoose
  .connect(DB_SERVER
  )
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => {
    console.log(err);
  });

// Morgan log to AWS s3 bucket
const s3 = new AWS.S3();
const s3Stream = {
  write: (logData) => {
    const params = {
      Bucket: 'application-logs-simple-note-app',
      Key: 'log-file.log',
      Body: logData
    };

    s3.putObject(params, (error) => {
      if (error) {
        console.error('Error uploading log to S3:', error);
      }
    });
  }
};
app.use(morgan('combined', { stream: s3Stream }));
// CORS
app.use(cors());


// Body parser
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRouter);
// images
app.use('/api/notes/images', express.static('uploads'));
// NoteRoutes here
app.use('/api/notes', checkToken, noteRouter);
//health
app.get('/health', (req, res) => {
  res.send('OK');
});

// Error handling
app.all((req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
