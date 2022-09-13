require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const path = require("path");
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);


// settings
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(morgan("dev"));
var secretRouter = require('./routes')(io);
app.use('/', secretRouter)
app.use(express.static(path.join(__dirname, "public")));


// listening the Server
server.listen(process.env.PORT, () => {
  console.log("Server on port", process.env.PORT);
});

//app.set('socketio', io);