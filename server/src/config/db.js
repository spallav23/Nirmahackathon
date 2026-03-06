const mongoose = require('mongoose');
const { mongodbUri } = require('./env');

let isConnected = false;

async function connectDb() {
  if (isConnected) return;
  try {
    await mongoose.connect(mongodbUri);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

module.exports = { connectDb, mongoose };
