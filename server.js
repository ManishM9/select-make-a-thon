var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var session = require("express-session");
var firebase = require("firebase");
// var zerorpc = require("zerorpc");
// var server = new zerorpc.Server({
//   hello: function(name, reply){
//     reply(null, "Hello"+name);
//   }
// });
// server.bind("tcp://*:4242");

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
      res.render("home", {username: req.session.username, uid:req.session.ID});
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


app.get("/api/:level1", function(req, res) {
    var level1 = req.params.level1;
    
    if(level1 === "login"){
      var username_entered = req.query.username;
      var password_entered = req.query.password;
      if(username_entered === null || password_entered === null){
        res.send("0");
      } else {
        db.ref("/members/"+username_entered).once("value", function(snapshot){
          var val = snapshot.val();
          if(val === null){
            res.send("-1");
          } else {
            if(val.Password === password_entered){
              req.session.username = username_entered;
              req.session.authorised = true;
              req.session.ID = val.ID;
              // res.send("Logged In!!!!");
              res.send("1");
            } else {
              res.send("-1");
            }
          }
        });
      }
      } else if(level1 == "receive"){
        
        var username = req.body.username;
        
        db.ref("/tosend/"+username).once("value", function(snapshot) {
            var val = snapshot.val();
            // console.log(val);
            var str_tosend = "";
            for(var item in val){
              str_tosend += String(val[item])+"\n";
              // console.log(item);
            }
            // console.log(str_tosend);
            
            if(str_tosend === ""){
              res.send("-1");
            } else {
              res.send(str_tosend);
              
              db.ref("/tosend/"+username).set(null);
              
            }
            
        });
        
      } else if(level1 === "send"){
      var data = req.query.data;
      var sendto = req.query.sendTo;
      console.log(req.body);
      console.log(data);
      console.log(sendto);
      
      db.ref("/members/"+sendto).once("value", function(snapshot) {
          var val = snapshot.val();
          console.log(val);
          if(val === null){
            res.send("-1");
          } else {
            db.ref("/tosend/"+sendto).push(data).then(doc => {
              res.send("1");
            });
          }
      });
    } else {
      res.send("-1");
    }
    
});

// app.post("/api/:level1", function(req, res) {
//     var level1 = req.params.level1;
    
//     if(level1 === "send"){
//       var data = req.body.data;
//       var sendto = req.body.sendTo;
//       console.log(req.body);
//       console.log(data);
//       console.log(sendto);
      
//       db.ref("/members/"+sendto).once("value", function(snapshot) {
//           var val = snapshot.val();
//           console.log(val);
//           if(val === null){
//             res.send("-1");
//           } else {
//             db.ref("/tosend/"+sendto).push(data).then(doc => {
//               res.send("1");
//             });
//           }
//       });
//     } else {
//       res.send("-1");
//     }
// });




app.get("/count", function(req, res) {
    console.log("COUNTER");
    res.send("test");
});


// app.get("/feedback", function(req, res) {
//     res.render("feedback");
// });

// app.post("/feedback", function(req, res) {
//     var reqb = req.body;
    
//     console.log("Accessed");
    
//     var name = reqb.name;
//     var delivery = reqb.delivery;
//     var conveneince = reqb.conveneince;
//     var feelings = reqb.feelings;
//     var something = reqb.something;
//     var fap = reqb.fap;
    
//     console.log("Name:"+name);
//     console.log("Delivery:"+delivery);
//     console.log("Conveneince:"+conveneince);
//     console.log("Feelings:"+feelings);
//     console.log("Something:"+something);
//     console.log("Fap:"+fap);
    
//     res.send("Submitted (Y)");
    
//     console.log("========================================");
    
// });




app.listen(process.env.PORT, process.env.IP, function(req,res){
  console.log("Server Started,"+process.env.PORT+","+process.env.IP);
});