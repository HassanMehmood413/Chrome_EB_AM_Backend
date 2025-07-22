import 'dotenv/config';
import express from 'express';

import './config/database.js';
import ApplyMiddlewares from './middlewares/index.js';
import router from './routes/index.js';

const app = express();

ApplyMiddlewares(app);

app.use('/v1', router);

app.listen(process.env.PORT, () => {
  console.log(`app is listening to port ${process.env.PORT}`);
});

// export default app;

