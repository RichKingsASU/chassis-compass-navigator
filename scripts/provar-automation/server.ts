import express from 'express';
import { runProvarPull } from './worker';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.WORKER_PORT || 3001;
const TOKEN = process.env.WORKER_INTERNAL_TOKEN;

app.post('/internal/provar/run', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!TOKEN || authHeader !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { run_id, portal, dateRange } = req.body;
  if (!run_id) return res.status(400).json({ error: 'Missing run_id' });

  // Start the worker in the background
  runProvarPull({ run_id, portal, dateRange }).catch(console.error);

  res.json({ message: 'Run started' });
});

app.listen(PORT, () => {
  console.log(`Provar worker server listening on port ${PORT}`);
});
