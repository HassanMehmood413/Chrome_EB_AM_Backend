import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import passport from 'passport';

import { LocalLoginStrategy, AuthenticationStrategy } from './auth.js';

const ApplyMiddlewares = (app) => {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(logger('common'));
  app.use(passport.initialize());
  passport.use(LocalLoginStrategy);
  passport.use(AuthenticationStrategy);
};

export default ApplyMiddlewares;
