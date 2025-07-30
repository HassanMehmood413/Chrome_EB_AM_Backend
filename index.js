import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import './config/database.js';
import ApplyMiddlewares from './middlewares/index.js';
import router from './routes/index.js';
import webhookRoutes from './routes/webhook.js';
import subscriptionScheduler from './services/subscriptionScheduler.js';

const app = express();

ApplyMiddlewares(app);

app.use('/v1', router);
app.use('/api', webhookRoutes);

app.listen(process.env.PORT, async () => {
  console.log(`app is listening to port ${process.env.PORT}`);
  
  // Wait for database connection before starting scheduler
  if (mongoose.connection.readyState === 1) {
    // Already connected
    subscriptionScheduler.start(60 * 60 * 1000); // 1 hour intervals
    console.log('Subscription expiration scheduler started');
  } else {
    // Wait for connection
    mongoose.connection.once('open', () => {
      subscriptionScheduler.start(60 * 60 * 1000); // 1 hour intervals
      console.log('Subscription expiration scheduler started');
    });
  }
});






