const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const { logActivity } = require('../helpers/logHelper');

// Get all subscriptions
exports.getSubs = (req, res) => {
  db.query(
    `SELECT 
    u.name AS name,
    u.email AS email,
    s.uuid,
    s.status,
    s.plan,
    s.billing_cycle,
    s.expiration_date,
    s.renewal_date,
    s.cycle_amount,
    s.discount_code,
    s.is_canceled,
    s.details
FROM 
    users u
JOIN 
    subscriptions s ON u.uuid = s.user_uuid;`,
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
};

// Get details of a specific subscription by uuid
exports.getSubByUuid = (req, res) => {
  const { uuid } = req.params;
  db.query(
    `SELECT 
    u.name AS name,
    u.email AS email,
    s.uuid,
    s.status,
    s.plan,
    s.billing_cycle,
    s.expiration_date,
    s.renewal_date,
    s.cycle_amount,
    s.discount_code,
    s.is_canceled,
    s.details
FROM 
    users u
JOIN 
    subscriptions s ON u.uuid = s.user_uuid
WHERE
    s.uuid = ?;`,
    [uuid],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: "Database query failed" });
      if (results.length === 0)
        return res.status(404).json({ message: "Subscription not found" });
      res.json(results[0]);
    }
  );
};

// Cancel a subscription
exports.cancelSub = (req, res) => {
  const { uuid, cancel_reason } = req.body;

  // send email

  db.query(
    "UPDATE subscriptions SET is_canceled = true, details = ? WHERE uuid = ?",
    [cancel_reason, uuid],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to cancel subscription" });

      // Log the activity
      logActivity(
        "Subscription",
        "Cancel Subscription",
        `Canceled subscription with reason: ${cancel_reason}`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "Subscription cancelled successfully" });
    }
  );
};

// Refund a subscription, which automatically cancels it and sets it to 'Expired'
exports.refundSub = (req, res) => {
  const { uuid, refund_amount } = req.body;

  // send email

  db.query(
    "UPDATE subscriptions SET status = 'Expired', is_canceled = true, details = 'Refunded with amount: ?' WHERE uuid = ?",
    [refund_amount, uuid],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to refund subscription" });

      // Log the activity
      logActivity(
        "Subscription",
        "Refund Subscription",
        `Refunded subscription with amount: ${refund_amount}`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "Subscription refunded successfully" });
    }
  );
};

// Update plan
exports.updatePlan = (req, res) => {
  const { uuid, new_plan } = req.body;
  db.query(
    "UPDATE subscriptions SET plan = ? WHERE uuid = ?",
    [new_plan, uuid],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to update subscription plan" });

      // Log the activity
      logActivity(
        "Subscription",
        "Update Plan",
        `Updated subscription plan to: ${new_plan}`,
        req.curUserUuid,
        uuid
      );

      res.json({ message: "Subscription plan updated successfully" });
    }
  );
};
