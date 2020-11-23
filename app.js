const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const errorController = require("./controllers/error");

const app = express();
const MONGODB_URI =
  "mongodb+srv://trung:trungtrinh38@cluster0.px6on.mongodb.net/shop";

/*
  Setting up for session to work with MongoDB
*/
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});
const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "trung secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
/*
  Must use csrf right after the session configs
  Now, for any post requests, the csrf will look
  for any any csrf token to continue with the request

  If there is no valid csrf token found, there will 
  be an error that says: 'invalid csrf token' 
  which prevents post request to continue
*/
app.use(csrfProtection);
/*
  registering connect-flash
  now we can use the flash middleware anywhere in our application
*/
app.use(flash());

/*
  Setting local fields for every request
  locals let us pass local variable that will be passed into the view
*/
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true })
  .then((result) => {
    app.listen(5000);
  })
  .catch((err) => console.log(err));
