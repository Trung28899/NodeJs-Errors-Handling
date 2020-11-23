const express = require("express");
const { check, body } = require("express-validator/check");
const authController = require("../controllers/auth");
const router = express.Router();
const User = require("../models/user");

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

/*
  normalizeEmail() is a method for sanitizing
  > make sure everything is in lower case

  trim() is sanitizing method, make sure no
  space in the input value
*/
router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Value is not an Email Dawg !")
      .normalizeEmail(),
    body("password", "Password should be from 6 to 15 characters")
      .isLength({
        min: 6,
        max: 15,
      })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "Email exists already, please pick a different one "
            );
          }
        });
      })
      .normalizeEmail(),
    body("password", "Password should be from 6 to 15 characters")
      .isLength({ min: 6, max: 15 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password and Confirm Password are not matching !");
        }
        return true;
      })
      .trim(),
  ],
  authController.postSignup
);

module.exports = router;
