var express = require("express");
const passport = require("passport");
const userModel = require("../routes/users");
var router = express.Router();
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const upload = require("./multer"); // multer.js
const postModel = require("./post");

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.post("/update", upload.single("image"), async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }
  );
  if (req.file) {
    user.ProfileImage = req.file.filename;
  }
  await user.save();
  res.redirect("/profile");
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});

router.get("/feed", async function (req, res) {
  const posts = await postModel.find().populate("user");
  res.render("feed", { footer: true, posts });
});

router.get("/profile", async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("profile", { footer: true, user });
});

router.get("/search", function (req, res) {
  res.render("search", { footer: true });
});

router.get("/edit", async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("edit", { footer: true, user });
});

router.get("/upload", function (req, res) {
  res.render("upload", { footer: true });
});
//  register
router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name,
  });

  if (!req.body.password) {
    return res.status(400).send("Password is required");
  }

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res, next) {
  req.logOut(function (err) {
    if (err) return next(err);
    else {
      res.redirect("/");
    }
  });
});

function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect("/");
}

// Multer
// Multer
router.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    if (!req.file) {
      return res.status(404).send("file not uploaded successfully");
    }
    // res.send("File uploaded successfully");
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const postData = await postModel.create({
      picture: req.file.filename,
      user: user._id,
      caption: req.body.caption,
    });
    user.posts.push(postData._id);
    await user.save();
    res.redirect("/feed");
  }
);
module.exports = router;
