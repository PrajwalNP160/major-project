import mongoose from "mongoose";

const groupChatMessageSchema = new mongoose.Schema(
  {
    studyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    socketId: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
groupChatMessageSchema.index({ studyGroupId: 1, createdAt: -1 });
groupChatMessageSchema.index({ userId: 1 });

const GroupChatMessage = mongoose.model("GroupChatMessage", groupChatMessageSchema);
export default GroupChatMessage;
