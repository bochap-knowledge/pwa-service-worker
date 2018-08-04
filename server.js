const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');

const vapidKeys = {
  publicKey: 'BI3lMy8rtcJyacFu-S5Od_YgZmVyHDVZIgTRZENbN6r5zoYbJmYWEvsV2eDpDXlOKwccA-GQcqWwumI9wWTHqm0',
  privateKey: 'KAp1BuAX1-aIplORlnOOX_v_2GUjUrP6LfIDovko1XI'
};

let subscription = null;

webPush.setVapidDetails(
  'mailto:darren_seet@oredi.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Simple no frills Express.js server that serves files from the public folder.
const app = express();
const server = require('http').createServer(app);
app.use(bodyParser.json());
app.use('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'public/scripts/sw.js')));

app.use('/api/kill', (req, res) => {
  server.close();
});

app.use('/api/register-notification/', (req, res) => {
  if (!req.body || !req.body.endpoint) {
    // Check that the request body has at least an endpoint if not is is an invalid subscription
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: {
        id: 'no-endpoint',
        message: 'Subscription must have an endpoint.'
      }
    }));
    return;
  }

  // Store inside the memory, more robust stores should be used but we want to keep this simple 
  subscription = req.body;
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({data: {success: true}}));
});

app.use('/api/send-notification/', (req, res) => {
  const start = Date.now();
  setTimeout(() => {
    webPush
      .sendNotification(subscription, 'We are not here to see you read documentation.')
      .then((response) => {
        console.log(`Send ${response}`)
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));  
        const difference = Date.now() - start;
        console.log("seconds elapsed = " + Math.floor(difference/1000));
        // console.log('Kill server');
        // server.close();
      })
      .catch((error) => {
          // Clear subscription from store
          subscription = null;
          console.log('Subscription is no longer valid:', error);
          res.status(400);
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({
            error: {
              id: 'send-notification',
              message: 'Notifications cannot be sent.'
            }
          }));
      })
  }, 3000);
});

app.use(express.static(path.join(__dirname, 'public')));
server.listen(8000, () => {
    console.log('Service worker application listening on port 8000!');
});