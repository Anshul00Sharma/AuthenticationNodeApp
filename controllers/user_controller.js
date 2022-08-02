const User = require("../models/user");
const crypto = require("crypto");
const transporter = require("../config/nodemailer");

//render the sign up page
module.exports.signUp = function (req, res) {
  return res.render("user_sign_up", {
    recaptcha: res.recaptcha,
    title: "Sign Up Page",
  });
};

//render the sign in page
module.exports.signIn = function (req, res) {
  return res.render("user_sign_in", {
    recaptcha: res.recaptcha,
    title: "Sign In Page",
  });
};

//get the sign up data and send mail a mail to user confirmation and verification
module.exports.createUser = async function (req, res) {
  try {
    //check for password match
    if (req.body.password != req.body.confirm_password) {
      req.flash(
        "error",
        "Please enter the correct password in the confirm password"
      );
      return res.redirect("back");
    }
    if (req.recaptcha.error) {
      req.flash("error", "Recaptcha Issue");
      return res.redirect("back");
    }

    let user = await User.findOne({ email: req.body.email });

    //If user is not present then create it
    if (!user) {
      await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });

      //Mailing system
      let mailOptions = {
        to: req.body.email,
        subject: "Authentication System | Signed Up",
        text:
          "Hey " +
          req.body.name +
          "\n\n Your Account has been created, Just signed in and enjoy :)",
      };

      //send the mail
      let mail = await transporter.sendMail(mailOptions);
      if (!mail) {
        req.flash("error", "Error in Sending Mail!");
      }

      req.flash("success", "You are registered with us! Check your mail");
      return res.redirect("/users/sign-in");
    } else {
      req.flash("error", "User already exist!");
      return res.redirect("/users/sign-in");
    }
  } catch (err) {
    console.log("Error", err);
    req.flash("error", "Some Error Occoured while signup!");
    return res.redirect("back");
  }
};

//to verify the user after signing-up and clicking on the email link
module.exports.verifyUser = async function (req, res) {
  try {
    await User.findOne(
      { passwordToken: req.params.token, tokenExpiry: { $gt: Date.now() } },
      function (err, user) {
        if (!user) {
          req.flash("error", "Token has been expired or isn't valid");
          return res.redirect("back");
        }
        user.isVerified = true;
        user.save();
        req.flash("success", "Hurray! Your account is verified successfully");
        return res.redirect("/users/sign-in");
      }
    );
  } catch (err) {
    req.flash("error", `Error caught ${err}`);
    res.redirect("back");
  }
};

//sign in and create session for user
module.exports.createSession = function (req, res) {
  req.flash("success", "LoggedIn Successfully");
  return res.redirect("/");
};

//sign out
module.exports.destroySession = function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have logged out!");
    res.redirect("/");
  });
};

//forgot password form views
module.exports.forgotPassword = function (req, res) {
  return res.render("forgot_password", {
    title: "Forgot Password Page",
    user: req.user,
  });
};

//forgot password
module.exports.forgotPasswordAction = async function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  //creation of tokens
  let token = await crypto.randomBytes(20).toString("hex");

  let user = await User.findOne({ email: req.body.email });

  //check the user is present in the sb or not
  if (!user) {
    req.flash("error", "No associated account with this email!");
    return res.redirect("back");
  }

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1800000; //Token will expires in half an hour
  user.save();

  let mailOptions = {
    to: user.email,
    subject: "Authentication System | Forgot Password Mail",
    text:
      "Hi, \n\n This is mail for the your requested for the forgot password of your account.\n\n" +
      "http://" +
      req.headers.host +
      "/users/reset-password/" +
      token +
      "\n\n",
  };

  let mail = await transporter.sendMail(mailOptions);
  if (!mail) {
    req.flash("error", "Error Sending Mail!");
  }

  req.flash(
    "success",
    "An e-mail has been sent to " + user.email + " with further instructions."
  );
  return res.redirect("/users/forgot-password");
};

//reset form view
module.exports.resetPasswordForm = function (req, res) {
  return res.render("password_reset", {
    title: "Reset Password",
    token: req.params.token,
  });
};

//reset password post action
module.exports.resetPasswordAction = async function (req, res) {
  try {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }

    let user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("back");
    }

    //Create New Password
    if (req.body.password == req.body.confirm_password) {
      user.password = req.body.password;
      user.save();
      req.flash("success", "Password Changed Successfully!.");
      res.redirect("/users/sign-in");
    } else {
      req.flash("error", "Passwords does not match.");
      return res.redirect("back");
    }
  } catch (err) {
    req.flash("error", "Some Error Occoured!");
    res.redirect("/users/forgot-password");
  }
};

module.exports.updatePassword = async function (req, res) {
  try {
    //if new password doesnt match
    if (req.body.new_password != req.body.confirm_password) {
      req.flash("error", "Passwords dont match");
      console.log("passwords dont match");
      return res.redirect("back");
    }
    console.log(req.user.id);

    let user = await User.findById(req.user.id);
    console.log(user);
    if (user) {
      if (user.matchPassword(req.body.old_password)) {
        user.password = req.body.new_password;
        await user.save();
        console.log(user);
        req.flash("success", "Password updated successfully");
        console.log("password updated successfully");
      } else {
        //if previous password is incorrect
        req.flash("error", "Incorrect password");
        console.log("incorrect password");
      }
    } else {
      req.flash("error", "user not found");
      console.log("user not found");
    }
    return res.redirect("back");
  } catch (err) {
    console.log(err);
    req.flash("error", "Internal system error");
    return res.redirect("back");
  }
};
