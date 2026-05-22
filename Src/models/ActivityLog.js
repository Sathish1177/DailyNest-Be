import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String
  },
  action: {
    type: String,
    required: true // e.g. "Create Product", "Delete Admin", "Login"
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
