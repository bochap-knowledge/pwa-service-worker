const path = require('path');
const express = require('express');

// Simple no frills Express.js server that serves files from the public folder.
const app = express();
app.use('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'public/scripts/sw.js')));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(8000, () => {
    console.log('Service worker application listening on port 8000!');
});