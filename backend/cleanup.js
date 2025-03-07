const mongoose = require('mongoose');
const User = require('./server');

mongoose.connect('mongodb://localhost:27017/ClusterTest', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');

    // Remove users with username: null
    const result = await User.deleteMany({ username: null });
    console.log(`Deleted ${result.deletedCount} users with null username`);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    mongoose.disconnect();
  });
