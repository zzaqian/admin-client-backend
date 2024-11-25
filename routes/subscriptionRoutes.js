const express = require("express");
const { getSubs, cancelSub, refundSub, updatePlan, getSubByUuid } = require("../controllers/subscriptionController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyToken, getSubs);
router.get("/:uuid", verifyToken, getSubByUuid);
router.put("/cancel", verifyToken, cancelSub);
router.put("/refund", verifyToken, refundSub);
router.put("/update-plan", verifyToken, updatePlan);

module.exports = router;
