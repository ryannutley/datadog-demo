'use strict'

const axios = require('axios')
const express = require('express')
const graphql = require('graphql')
const graphqlHTTP = require('express-graphql')
const expressWinston = require('express-winston')
const logger = require('./logger')
const path = require('path')
const cors = require('cors')

const userRepository = require('./model')

const CONFIG = JSON.parse(process.env.DEMO_CONFIG)
const CONNECTS = JSON.parse(process.env.DEMO_CONNECTS)
const assets_path = path.join(__dirname+"/assets/"+CONFIG.template)

const app = express()

app.use(cors())

app.use(express.static(assets_path))

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
  users: () => userRepository.all()
}
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}))

// Homepage
app.get('/', (req, res) => {
  res.sendFile(assets_path+'index.html')
  // res.status(200).send("<strong>helloworld</strong>")
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
          urls.push("http://"+CONNECTS[a].name+":"+CONNECTS[a].port+"/")
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
            //console.log(error);
            res.status(502).send(error)
          })
      }
    } else {
      res.status(200).send("test successful")
    }
  })
}

// Login
app.get('/login', (req, res) => {
  res.status(200).send("<strong>login</strong>")
})

app.get('/branch_locator', (req, res) => {
  axios.get('http://geocode:8100/search_location')
    .then((response) => {
      console.log(response)
      res.status(200).send("branch locator")
    })
    .catch(() => {
      res.status(502).send()
    })
})

// axios.get('http://auth:8000/.well-known/jwks.json')
//   .then(() => {
//     return axios.post('http://user:8000/graphql', {
//       query: `{ users { name age } }`
//     }, {
//       headers: { 'Content-Type': 'application/json' }
//     })
//   })
//   .then(response => {
//     res.status(200).send(response.data.data)
//   })
//   .catch(() => {
//     res.status(502).send()
//   })

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}))

module.exports = app
