const express = require('express');
const winston = require('winston'), WinstonCloudWatch = require('winston-cloudwatch');
const userRouter = require('./routers/userRouter');
const morgan = require('morgan');
const PORT = 80;
const cors = require('cors');
const { checkToken } = require('./middlewares/checkToken');
const app = express();
const mongoose = require('mongoose');
const { DB_SERVER } = require('./config.json');
const noteRouter = require('./routers/noteRouter');
const AWS = require('aws-sdk');
const os = require('os');

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

// Morgan log to AWS cloudwatch using winston
const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      logGroupName: 'simple-note-app-logs',
      logStreamName: 'logs-from-server-' + os.hostname(),
      awsRegion: 'us-east-1',
      jsonMessage: true,
    }),
  ],
});

morgan('combined', {
  stream: logger,
});
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
