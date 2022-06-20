require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { request } = require("http");
const session = require("express-session");
const flash = require("connect-flash");

//mongodb models
const User = require("./models/user");

//bcrypt
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(cookieParser(process.env.SECRET));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true },
  })
);
app.use(flash());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to mongodb.");
  })
  .catch((e) => {
    console.log(e);
  });

app.get("/", (req, res) => {
  req.flash("success_msg", "Successfully get to the homepage.");
  res.send("Hi, " + req.flash("success_msg"));
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    let foundUser = await User.findOne({ username });
    if (foundUser) {
      bcrypt.compare(password, foundUser.password, (err, result) => {
        if (err) {
          next(err);
        }
        if (result === true) {
          res.render("secret");
        } else {
          res.send("USERNAME or PASSWORD not correct");
        }
      });
    } else {
      res.send("USERNAME or PASSWORD not correct");
    }

    // if (foundUser && password === foundUser.password) {
    //   res.render("secret");
    // } else {
    //   res.send("Username or Passowrd not correct.");
    // }
  } catch (err) {
    next(err);
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res, next) => {
  console.log(req.body);
  let { username, password } = req.body;

  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      next(err);
    }
    console.log("salt: >> " + salt);
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        next(err);
      }

      console.log("hash: >> " + hash);
      let newUser = new User({ username, password: hash });
      try {
        newUser
          .save()
          .then(() => {
            res.send("Data has been saved.");
          })
          .catch((e) => {
            res.send("Error.");
          });
      } catch (err) {
        next(err);
      }
    });
  });
});

app.get("/verifyUser", (req, res) => {
  req.session.isVerified = true;
  res.send("You are verified.");
});

app.get("/secret", (req, res) => {
  if (req.session.isVerified) {
    res.send("mySecret is HERE!");
  } else {
    res.status(403).send("You are not authorized to see my secret.");
  }
});

app.get("/*", (req, res) => {
  res.status(404).send("404 Page Not Found");
});

// error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Something is broken.");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
