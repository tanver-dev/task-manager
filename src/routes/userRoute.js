const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { getUsers } = require("../controller/userController");

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "manager"), getUsers);


module.exports = router
