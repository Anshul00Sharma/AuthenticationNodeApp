const nodemailer = require("nodemailer");

//defining transporter
// create reusable transporter object using the default SMTP transport
//this is the part which sends email and how communication takes place
let transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "examplefor040@gmail.com",
    pass: "cyzzdjtygllcodyw",
  },
});

module.exports = transporter;
