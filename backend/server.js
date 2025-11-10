require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const userRouter = require('./routes/userRoutes');
const leaveRequestRouter = require('./routes/leaveRequestRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev', {
  stream: fs.createWriteStream(path.join(__dirname, 'logs', 'combine.log'), { flags: 'a' })
}));

// Routes
app.use('/user', userRouter);
app.use('/leave', leaveRequestRouter);

// Connect to DB and start server
connectDB()
  .then(() => {
    logger.info('MongoDB connected successfully');
    const PORT = process.env.SERVER_PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running at ${PORT}`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
    });
  })
  .catch((error) => logger.error(error.message));

module.exports = app;

