module.exports = (req, res, next) => {
  /*
        If user not logged in, redirect to login page, 
        If user logged in go to next middleware
    */
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};
