exports.get404 = (req, res, next) => {
  res.status(404).render("404", {
    isAuthenticated: req.session.isLoggedIn,
    pageTitle: "Page Not Found",
    path: "/404",
  });
};
