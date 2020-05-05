'use strict'

const express = require('express')
const graphql = require('graphql')
const graphqlHTTP = require('express-graphql')
const db_collection = require('./model')
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

const schema = graphql.buildSchema(`
  type Query {
    users: [User]
  }

  type User {
    name: String
    age: Int
  }
`)

const rootValue = {
  users: () => db_collection.all()
}

app.get('/', (req, res) => {
  res.status(200).send("test successful")
})
app.get('/test', (req, res) => {
  if (process.env.DEMO_PING) {
    var url = 'http://'+process.env.DEMO_PING+':'+process.env.DEMO_PING_PORT+'/'+process.env.DEMO_PING_PATH
    axios.get(url)
      .then((response) => {
        res.status(200).send("test successful on "+url)
      })
      .catch(() => {
        res.status(502).send()
      })
  } else {
    res.status(200).send("test successful")
  }
})

// Test URL for
app.get('/info', (req, res) => {
  var info = {
    "config" : CONFIG,
    "connects" : CONNECTS
  };
  console.log(JSON.stringify(CONFIG, undefined, 2));
  console.log(JSON.stringify(CONNECTS, undefined, 2));

  console.log( rootValue )

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
