'use strict'

const axios = require('axios')
const express = require('express')
const expressWinston = require('express-winston')
const logger = require('./logger')

const app = express()

app.use(expressWinston.logger({
  winstonInstance: logger
}))

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

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}))

module.exports = app
