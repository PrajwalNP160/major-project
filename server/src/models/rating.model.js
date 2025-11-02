import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    exchangeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
      required: true,
      index: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Rating categories (1-5 stars each)
    ratings: {
      skillKnowledge: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      punctuality: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      helpfulness: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      overall: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },
    // Text feedback
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Skills that were exchanged
    skillTaught: {
      type: String,
      required: true,
    },
    skillLearned: {
      type: String,
      required: true,
    },
    // Would recommend this person
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    // Helpful tags
    tags: {
      type: [String],
      default: [],
      enum: [
        "Patient",
        "Knowledgeable",
        "Great Communicator",
        "Well Prepared",
        "Flexible",
        "Motivating",
        "Clear Explanations",
        "Practical Examples",
        "Good Listener",
        "Professional",
      ],
    },
    // Visibility
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Response from rated user
    response: {
      text: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one rating per user per exchange
ratingSchema.index({ exchangeId: 1, ratedBy: 1 }, { unique: true });

// Index for efficient queries
ratingSchema.index({ ratedUser: 1, isPublic: 1 });
ratingSchema.index({ ratedBy: 1 });

// Virtual for average rating
ratingSchema.virtual("averageRating").get(function () {
  const { skillKnowledge, communication, punctuality, helpfulness, overall } =
    this.ratings;
  return (
    (skillKnowledge + communication + punctuality + helpfulness + overall) / 5
  );
});

// Ensure virtuals are included in JSON
ratingSchema.set("toJSON", { virtuals: true });
ratingSchema.set("toObject", { virtuals: true });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
