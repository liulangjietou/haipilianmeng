import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { seed } from './db.js';
import authRoutes from './routes/auth.js';
import voteRoutes from './routes/votes.js';
import resultRoutes from './routes/results.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(join(__dirname, 'client/dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  res.sendFile(join(__dirname, 'client/dist/index.html'));
});

async function start() {
  await seed();
  app.listen(PORT, () => {
    console.log(`篮球投票服务已启动: http://localhost:${PORT}`);
    console.log('默认管理员账号: huangtian / huangtian666');
  });
}

start();
