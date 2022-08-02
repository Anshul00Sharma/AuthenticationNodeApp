// importing express for router
const express = require("express");
const router = express.Router();

const homeController = require("../controllers/home_controller");

//routes for home page
router.get("/", homeController.home);

//rotes for user
router.use("/users", require("./users"));

// exporting router
module.exports = router;
