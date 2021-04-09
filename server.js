const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dataService = require("./data-service.js");
const userService = require("./user-service.js");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const app = express();


var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;


var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

jwtOptions.secretOrKey =
  "q&MeDtbqhVZr45FUN5*Dj$&J%n7EjDyN&YEs8O343ASKmI1D%t mSw7O2#KPrMx^1";

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);

  if (jwt_payload) {
    next(null, { _id: jwt_payload._id, userName: jwt_payload.userName });
  } else {
    next(null, false);
  }
});


passport.use(strategy);


app.use(passport.initialize());
app.use(express.json());
app.use(cors());

const HTTP_PORT = process.env.PORT || 8080;



app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ success: msg });
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      var payload = {
        _id: user._id,
        userName: user.userName,
      };

      var token = jwt.sign(payload, jwtOptions.secretOrKey);

      res.json({ message: "login successful", token: token });
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.post("/api/user/favourites", (req, res) => {
  userService
    .getFavourites(req.user._id.body)
    .then((msg) => {
      res.json({ success: msg });
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dataService
      .addFavourite(req.user._id.body)
      .then((msg) => {
        res.json({ success: msg });
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dataService
      .removeFavourite(req.user._id.body)
      .then((msg) => {
        res.json({ success: msg });
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
