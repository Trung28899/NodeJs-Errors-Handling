const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
/*
  This is a built-in library for generating tokens
*/
const crypto = require("crypto");
const { validationResult } = require("express-validator/check");

/*
  Setting up to send email
*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreplyemailon@gmail.com",
    pass: "trungtrinh38",
  },
});

const mailTemplate = {
  from: "trevtrinh@gmail.com",
  to: null,
  subject: null,
  text: null,
  html: null,
};

exports.getLogin = (req, res, next) => {
  // console.log(req.session.isLoggedIn);
  // console.log(req.session.user);
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.user = user;
            req.session.isLoggedIn = true;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    return res.redirect("/");
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        email: email,
        password: hashPassword,
        cart: { items: [] },
      });

      return user.save();
    })
    .then((result) => {
      const emailObject = {
        ...mailTemplate,
        to: result.email,
        subject: "Shop sign up succeeded",
        html: "<h1>You are successfully signed up</h1>",
      };

      transporter.sendMail(emailObject, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent");
          // console.log(info.response);
        }
      });
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  /*
    Generating an unique token so only the user
    that is allowed to change password can change the
    password with the given reset password link
  */
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found !");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        /*
          Token expire in one hour
        */
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        const emailObject = {
          ...mailTemplate,
          to: req.body.email,
          subject: "Password Reset",
          html: `
          <p>You have requested a password reset</p>
          <p>Click <a href="http://localhost:5000/reset/${token}">This Link</a> to set a new password </p> 
          <p>This link will expire in 1 hour</p> 
        `,
        };

        transporter.sendMail(emailObject, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log("Email reset pw sent");
            // console.log(info.response);
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  /*
    Find user with field resetToken matching the token
    got from url parameter
    and token is not expired

    $gt: Date.now(): means date of the resetTokenExpiration 
    is greater than now > means it is not expired
  */
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      message.length > 0 ? (message = message[0]) : (message = null);
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => console.log(err));
};

/*
  Process post request that change the password
*/
exports.postNewPassword = (req, res, next) => {
  /*
    req.body because input fields in ./views/new-password.ejs have the
    name of password and userId
  */
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  /*
    Find user with field resetToken matching the token
    got from url parameter
    and token is not expired
  */
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => console.log(err));
};
