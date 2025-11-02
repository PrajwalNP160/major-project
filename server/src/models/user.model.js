import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    location: {
      type: String,
    },
    role: {
      type: String,
      enum: ["learner", "mentor", "admin"],
      default: "learner",
    },
    isOnBoarded: {
      type: Boolean,
      default: false,
    },
    skills: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    projects: [
      {
        name: {
          type: String,
          required: false,
        },
        gitHubUrl: {
          type: String,
          required: false,
        },
      },
    ],
    availability: { type: [String], default: [] },
    skillsToLearn: { type: [String], default: [] },
    experience: {
      type: String,
    },
    experienceType: {
      type: String,
    },
    // Rating statistics
    ratingStats: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      skillKnowledge: {
        type: Number,
        default: 0,
      },
      communication: {
        type: Number,
        default: 0,
      },
      punctuality: {
        type: Number,
        default: 0,
      },
      helpfulness: {
        type: Number,
        default: 0,
      },
      recommendationRate: {
        type: Number,
        default: 0, // Percentage of users who would recommend
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
