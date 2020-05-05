'use strict'

const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser')
const expressWinston = require('express-winston')
const logger = require('./logger')
const path = require('path')

const { exec } = require("child_process")
const fs = require('fs')

const assets_path = path.join(__dirname+"/assets/")

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(assets_path))

app.use(expressWinston.logger({
  winstonInstance: logger
}))

app.get('/', (req, res) => {
  res.sendFile(assets_path+'index.html')
})

// Take the schema and generate some files
app.post('/', (req, res) => {
  // Kill containers before saving new environment file
  exec("docker-compose -f "+__dirname+"/../../docker-compose.yaml down && docker-compose -f "+__dirname+"/../../docker-compose.yaml rm")
  exec("docker kill $(docker ps -aq)")
  exec("docker rm $(docker ps -aq)")
  exec("docker network prune -f")
  fs.writeFile(__dirname+"/../../environment.json", JSON.stringify(req.body, null, 2), 'utf8', function(err){
    if (err)
      res.status(500).send("environment schema failed to build...")
    else {
      exec("php "+__dirname+"/../../demo.php")
      res.status(200).send("environment schema file saved...")
    }
  })
})

app.post('/run', (req, res) => {
  exec("docker-compose -f "+__dirname+"/../../docker-compose.yaml build && docker-compose -f "+__dirname+"/../../docker-compose.yaml up")
  res.status(200).send("building images and launching containers...")
})

app.post('/simulate', (req, res) => {
  exec("php "+__dirname+"/../../network.php")
  res.status(200).send("simulating network activity...")
})

app.post('/kill', (req, res) => {
  exec("docker-compose -f "+__dirname+"/../../docker-compose.yaml down && docker-compose -f "+__dirname+"/../../docker-compose.yaml rm")
  exec("docker kill $(docker ps -aq)")
  exec("docker rm $(docker ps -aq)")
  exec("docker network prune -f")
  res.status(200).send("destroying environment...")
})

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}))

module.exports = app
