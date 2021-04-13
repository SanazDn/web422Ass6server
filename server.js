const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

const JwtStrategy = passportJWT.Strategy;

dotenv.config();
var jwtOptions = {};

const ExtractJwt = passportJWT.ExtractJwt;
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("JWT");
jwtOptions.secretOrKey = process.env.JWT_SECRET;



var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);
    if (jwt_payload) {
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName
         }); 
    } else {
        next(null, false);
    }
});

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cors());
passport.use(strategy);


app.use(passport.initialize());


app.post("/api/user/register",(req,res)=>{

    console.log('register')
    userService.registerUser(req.body)
    .then((msg)=>{
        res.json({"message":msg});
    }).catch((msg)=>{
        res.status(422).json({"message":msg});
    });
});

app.post("/api/user/login",(req,res)=>{
    

    userService.checkUser(req.body)
    .then((user) => {
       var payload={
           _id:user._id,
           userName: user.userName
       };
       var token = jwt.sign(payload, process.env.JWT_SECRET);
       res.status(200).json(
            { "message": "login successful", "token": token }
        );
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.get("/api/user/favourites",passport.authenticate('jwt',{session:false}),(req,res)=>{
    userService.getFavourites(req.user._id)
    .then((data)=>{
        res.json(data);
    }).catch((err)=>{
        res.json({"error":err, data});
    });
});


app.put("/api/user/favourites/:id",passport.authenticate('jwt',{session:false}),(req,res)=>{
    console.log(req.params)
    userService.addFavourite(req.user._id, req.params.id)
    .then((data)=>{
        res.json(data);
    }).catch((err)=>{
        res.json({"error":err, data});
    });
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt',{session:false}),(req,res)=>{
    userService.removeFavourite(req.user._id,req.params.id)
    .then((data)=>{
        res.json(data);
    }).catch((err)=>{
        res.json({"error":err, data});
    });
});



userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});
