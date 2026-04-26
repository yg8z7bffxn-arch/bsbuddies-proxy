const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;
const NIGHTSCOUT = 'cgm-remote-monitor-production-40b4.up.railway.app';
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;
const TWILIO_TO = process.env.TWILIO_TO;
const LOW_THRESHOLD = 300;

let lastAlertTime = 0;
let lastAlertType = null;

function sendSMS(message) {
  const body = `To=${encodeURIComponent(TWILIO_TO)}&From=${encodeURIComponent(TWILIO_FROM)}&Body=${encodeURIComponent(message)}`;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const options = {
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.length
    }
  };
  const req = https.request(options, (res) => {
    console.log(`SMS sent! Status: ${res.statusCode}`);
  });
  req.on('error', (e) => console.error('SMS error:', e.message));
  req.write(body);
  req.end();
}

function checkAlerts(sgv, direction) {
  const now = Date.now();
  const cooldown = 30 * 60 * 1000;
  if (sgv < LOW_THRESHOLD) {
    if (lastAlertType !== 'low' || now - lastAlertTime > cooldown) {
      sendSMS(`🚨 BS Buddies: Kyle's is LOW at ${sgv} mg/dL and ${direction}. Sugar NOW.`);
      lastAlertTime = now;
      lastAlertType = 'low';
      console.log(`LOW alert sent! SGV: ${sgv}`);
    }
  } else {
    if (lastAlertType === 'low') lastAlertType = null;
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/glucose') {
    https.get(`https://${NIGHTSCOUT}/api/v1/entries/current.json`, (r) => {
      let data = '';
      r.on('data', chunk => data += chunk);
      r.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const entry = Array.isArray(parsed) ? parsed[0] : parsed;
          if (entry && entry.sgv) {
            checkAlerts(entry.sgv, entry.direction || 'Flat');
          }
          res.end(data);
        } catch(e) {
          res.end(data);
        }
      });
    }).on('error', (e) => res.end(JSON.stringify({error: e.message})));
  } else {
    res.end(JSON.stringify({status: 'BS Buddies Proxy Running'}));
  }
});

server.listen(PORT, () => console.log(`Running on port ${PORT}`));


