const mongoose = require("mongoose");

const customPromotionTemplates = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      unique: true,
      default: "test title",
    },
    body: {
      type: String,
      trim: true,
      default: "test body",
    },
    type: {
      type: String,
      trim: true,
      default: "testtype",
    },
    // cronJob: cronJob,

    startDate: {
      type: Date,
      require: true,
    },
    endDate: {
      type: Date,
      require: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const customPromotionTemplate = mongoose.model(
  "customPromotionTemplate",
  customPromotionTemplates
);

module.exports = customPromotionTemplate;
