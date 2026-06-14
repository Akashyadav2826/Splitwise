import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import expenseRoutes from './routes/expenses';
import settlementRoutes from './routes/settlements';
import chatRoutes from './routes/chats';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './socket';
import pool from './db/pool';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

initSocket(httpServer);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/expenses', expenseRoutes);
app.use('/api/groups/:groupId/settlements', settlementRoutes);
app.use('/api/expenses/:expenseId/chats', chatRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000');

pool.query('SELECT 1').then(() => {
  console.log('Database connected');
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
