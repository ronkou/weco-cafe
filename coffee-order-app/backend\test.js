import express from 'express';

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Test server running' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});