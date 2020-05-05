'use strict'

const express = require('express')
const cache = require('./cache')
const expressWinston = require('express-winston')
const logger = require('./logger')
const cors = require('cors')

const app = express()

const CONFIG = JSON.parse(process.env.DEMO_CONFIG)
const CONNECTS = JSON.parse(process.env.DEMO_CONNECTS)

app.use(cors())

app.use(expressWinston.logger({
  winstonInstance: logger
}))

app.get('/', (req, res) => {
  cache.get('jwks', (err, value) => {
    if (err) {
      return res.status(500).send()
    }
    res.status(200).send(value)
  })
})

// Test URL for
app.get('/info', (req, res) => {
  var info = {
    "config" : CONFIG,
    "connects" : CONNECTS
  };
  console.log(JSON.stringify(CONFIG, undefined, 2));
  console.log(JSON.stringify(CONNECTS, undefined, 2));

  // Hook the connections in
  if (CONNECTS != null){
    if (CONNECTS.length > 0){
      var urls = [];
      for (var a=0; a < CONNECTS.length; a++) {
        urls.push("http://"+CONNECTS[a].name+":"+CONNECTS[a].port+"/")
        if (CONNECTS[a].paths != null)
          for (var b=0; b < CONNECTS[a].paths.length; b++)
            urls.push(CONNECTS[a].name+":"+CONNECTS[a].port+"/"+CONNECTS[a].paths[b])
      }
      info.urls = urls;
    }
  }
  res.status(200).send( JSON.stringify(info, undefined, 2) )
})

// Add the custom resources
for (var i=0; i < CONFIG.resources.length; i++) {
  console.log(CONFIG.resources);
  var URL = CONFIG.resources[i];
  console.log("creating route for URL : "+URL );
  app.get('/'+URL, (req, res) => {
    if (CONNECTS != null){
      if (CONNECTS.length > 0){
        var urls = [];
        // Hook the connections in
        for (var a=0; a < CONNECTS.length; a++) {
          urls.push("http://"+CONNECTS[a].name+":"+CONNECTS[a].port+"/");
          if (CONNECTS[a].paths != null)
            for (var b=0; b < CONNECTS[a].paths.length; b++)
              urls.push("http://"+CONNECTS[a].name+":"+CONNECTS[a].port+"/"+CONNECTS[a].paths[b])
        }
        var rand = Math.floor(Math.random() * urls.length)
        console.log("Pinging....."+urls[rand]);
        axios.get(urls[rand])
          .then((response) => {
            res.status(200).send("test successful")
          })
          .catch((error) => {
            console.log(error);
            res.status(502).send(error)
          })
      }
    } else {
      res.status(200).send("test successful")
    }
  })
}

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}))

module.exports = app
