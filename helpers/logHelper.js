// logHelper.js
const db = require("../config/db"); // Ensure this points to your DB configuration

/**
 * Log an activity in the database.
 * @param {string} category - Was the action performed to a User or a Subscription?
 * @param {string} activityName - The name of the activity (e.g., "Create User").
 * @param {string} activityDetails - Detailed description of the activity.
 * @param {number} performedBy - The ID of the user performing the action.
 * @param {number} [target] - The ID of User or Subscription ID (if applicable).
 */
const logActivity = (
  category,
  activityName,
  activityDetails,
  performedBy,
  target = null
) => {
  const query = `
        INSERT INTO activity_log (category, activity_name, activity_details, performed_by, target)
        VALUES (?, ?, ?, ?, ?)
    `;
  db.query(
    query,
    [category, activityName, activityDetails, performedBy, target],
    (err) => {
      if (err) {
        console.error("Failed to log activity:", err);
      }
    }
  );
};

/**
 * Log an error in the backend.
 * @param {string} functionName - The name of the backend function (e.g., "createUser").
 * @param {string} errorCode - Error code returned by the db query.
 * @param {string} errorMessage - Error message returned by the db query.
 */
const logError = (functionName, errorCode = null, errorMessage = null) => {
  const query = `
        INSERT INTO error_log (function_name, error_code, error_message)
        VALUES (?, ?, ?)
    `;
  db.query(query, [functionName, errorCode, errorMessage], (err) => {
    if (err) {
      console.error("Failed to log backend error:", err);
    }
  });
};

module.exports = {
  logActivity,
  logError,
};
