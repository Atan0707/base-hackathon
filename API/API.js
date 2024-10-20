const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let currentTimes = {
  timeBlue: 0,
  timeRed: 0,
  timeGreen: 0
};

app.post('/updateTimes', (req, res) => {
  const { timeBlue, timeRed, timeGreen } = req.body;
  currentTimes = { timeBlue, timeRed, timeGreen };
  res.json({ message: 'Times updated successfully' });
});

app.get('/getTimes', (req, res) => {
  res.json(currentTimes);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
