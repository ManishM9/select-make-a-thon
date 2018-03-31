// //
// // # SimpleServer
// //
// // A simple chat server using Socket.IO, Express, and Async.
// //
// var http = require('http');
// var path = require('path');

// var async = require('async');
// var socketio = require('socket.io');
// var express = require('express');

// //
// // ## SimpleServer `SimpleServer(obj)`
// //
// // Creates a new instance of SimpleServer with the following options:
// //  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
// //
// var router = express();
// var server = http.createServer(router);
// var io = socketio.listen(server);

// router.use(express.static(path.resolve(__dirname, 'client')));
// var messages = [];
// var sockets = [];

// io.on('connection', function (socket) {
//     messages.forEach(function (data) {
//       socket.emit('message', data);
//     });

//     sockets.push(socket);

//     socket.on('disconnect', function () {
//       sockets.splice(sockets.indexOf(socket), 1);
//       updateRoster();
//     });

//     socket.on('message', function (msg) {
//       var text = String(msg || '');

//       if (!text)
//         return;

//       socket.get('name', function (err, name) {
//         var data = {
//           name: name,
//           text: text
//         };

//         broadcast('message', data);
//         messages.push(data);
//       });
//     });

//     socket.on('identify', function (name) {
//       socket.set('name', String(name || 'Anonymous'), function (err) {
//         updateRoster();
//       });
//     });
//   });

// function updateRoster() {
//   async.map(
//     sockets,
//     function (socket, callback) {
//       socket.get('name', callback);
//     },
//     function (err, names) {
//       broadcast('roster', names);
//     }
//   );
// }

// function broadcast(event, data) {
//   sockets.forEach(function (socket) {
//     socket.emit(event, data);
//   });
// }

// server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
//   var addr = server.address();
//   console.log("Chat server listening at", addr.address + ":" + addr.port);
// });



var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var session = require("express-session");
var firebase = require("firebase");
var zerorpc = require("zerorpc");
var server = new zerorpc.Server({
  hello: function(name, reply){
    reply(null, "Hello"+name);
  }
});
server.bind("tcp://*:4242");

var config = {
    apiKey: "AIzaSyC9VTc7oeiusK5f56jz-Cv4BlYtgwlZSWQ",
    authDomain: "viserion-1caa5.firebaseapp.com",
    databaseURL: "https://viserion-1caa5.firebaseio.com",
    projectId: "viserion-1caa5",
    storageBucket: "viserion-1caa5.appspot.com",
    messagingSenderId: "346168377822"
  };
firebase.initializeApp(config);
var db = firebase.database();

app.use(session({
    secret: 'A6D1Aasf87yJINFKAS61',
    resave: true,
    saveUninitialized: false,
    authorised: false,
    username: "",
    ID: ""
}));

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/assets"));

app.use(bodyparser.urlencoded({extended:false}));

app.get("/", function(req,res){
    console.log("/");
    res.redirect("/login");
});

app.get("/signup", function(req,res){
    if(req.session.authorised){
      res.redirect("/home");
    } else {
      res.render("signup");
    }
});

app.post("/signup", function(req, res) {
    if(req.session.authorised){
      res.redirect("/home");
    } else {
      var reqb = req.body;
      
      var email_entered = reqb.email;
      var name_entered = reqb.name;
      var username_entered = reqb.username;
      var password_entered = reqb.password;
      
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
      
      console.log(email_entered+","+name_entered+","+username_entered+","+password_entered+","+text);
      
      var obj_to_add = {
        Email: email_entered,
        Name: name_entered,
        ID: text,
        Password: password_entered
      };
      
      db.ref("/members/"+username_entered).set(obj_to_add).then(doc => {
        console.log("Added:" + username_entered);
        res.redirect("/login");
      });
      
    }
});

app.get("/login", function(req, res) {
    if(req.session.authorised){
      res.redirect("/home");
    } else {
      res.render("login", {display:""});
    }
});

app.post("/login", function(req,res){
    var reqb = req.body;
    var username = reqb.username;
    var password_entered = reqb.password;
    
    db.ref("/members/"+username).once("value", function(snapshot){
      var val = snapshot.val();
      if(val === null){
        res.render("login", {display:"Username or Password entered is wrong"});
      } else {
        if(val.Password === password_entered){
          req.session.username = username;
          req.session.authorised = true;
          req.session.ID = val.ID;
          // res.send("Logged In!!!!");
          res.redirect("/home");
        } else {
          res.render("login", {display:"Username or Password entered is wrong"});
        }
      }
    });
    
});

app.get("/home", function(req, res) {
    if(req.session.authorised){
      res.render("home", {username: req.session.username});
    } else {
      res.redirect("/login");
    }
});

app.get("/checksession", function(req, res) {
    var username = req.session.username;
    var authorised = req.session.authorised;
    var ID = req.session.ID;
    res.send("Username: "+username+", Authorised: "+authorised+", ID: "+ID);
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.send("Session Destroyed.");
});



app.listen(process.env.PORT, process.env.IP, function(req,res){
  console.log("Server Started,"+process.env.PORT+","+process.env.IP);
});