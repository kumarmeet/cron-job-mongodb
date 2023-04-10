const mongoose = require("mongoose");

const customPromotionTemplates = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      trim: true,
      default: "",
    },
    intervals: {
      type: Number,
      default: 1,
    },
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
      default: true,
    },
  },
  { timestamps: true }
);

const customPromotionTemplate = mongoose.model(
  "customPromotionTemplate",
  customPromotionTemplates
);

module.exports = customPromotionTemplate;
