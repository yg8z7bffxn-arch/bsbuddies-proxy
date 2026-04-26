const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;
const NIGHTSCOUT = 'cgm-remote-monitor-production-40b4.up.railway.app';
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;
const TWILIO_TO = process.env.TWILIO_TO;
const LOW_THRESHOLD = 300;

function sendSMS() {
  const msg = 'Kyle LOW. Give juice NOW.';
  const body = `To=${encodeURIComponent(TWILIO_TO)}&From=${encodeURIComponent(TWILIO_FROM)}&Body=${encodeURIComponent(msg)}`;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const options = {
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const req = https.request(options, (res) => {
    console.log(`SMS status: ${res.statusCode}`);
  });
  req.on('error', (e) => console.error('SMS error:', e.message));
  req.write(body);
  req.end();
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
            console.log(`SGV: ${entry.sgv} threshold: ${LOW_THRESHOLD}`);
            if (entry.sgv < LOW_THRESHOLD) {
              console.log('Sending SMS!');
              sendSMS();
            }
          }
          res.end(data);
        } catch(e) {
          console.error('Parse error:', e.message);
          res.end(data);
        }
      });
    }).on('error', (e) => res.end(JSON.stringify({error: e.message})));
  } else {
    res.end(JSON.stringify({status: 'ok'}));
  }
});

server.listen(PORT, () => console.log(`Running on port ${PORT}`));
