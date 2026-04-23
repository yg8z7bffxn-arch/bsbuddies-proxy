const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;
const NIGHTSCOUT_URL = 'https://cgm-remote-monitor-production-40b4.up.railway.app';

app.use(cors());

app.get('/glucose', async (req, res) => {
  try {
    const response = await fetch(`${NIGHTSCOUT_URL}/api/v1/entries/current.json`);
    const data = await response.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`BS Buddies proxy running on port ${PORT}`);
});
