const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;
const NIGHTSCOUT = 'cgm-remote-monitor-production-40b4.up.railway.app';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/glucose') {
    https.get(`https://${NIGHTSCOUT}/api/v1/entries/current.json`, (r) => {
      let data = '';
      r.on('data', chunk => data += chunk);
      r.on('end', () => res.end(data));
    }).on('error', (e) => res.end(JSON.stringify({error: e.message})));
  } else {
    res.end(JSON.stringify({status: 'BS Buddies Proxy Running'}));
  }
});

server.listen(PORT, () => console.log(`Running on port ${PORT}`));
