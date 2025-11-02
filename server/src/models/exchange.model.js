import mongoose from "mongoose";

const exchangeSchema = new mongoose.Schema({
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      teaches: {
        type: String,
      },
      learns: {
        type: String,
      },
      hasRated: {
        type: Boolean,
        default: false,
      },
    },
  ],
  status: {
    type: String,
    enum: ["active", "completed", "cancelled", "on-hold"],
    default: "active",
  },
  nextSession: {
    type: Date,
    default: null,
  },
  sessionsCompleted: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
  },
  canBeRated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

export const Exchange = mongoose.model("Exchange", exchangeSchema);
