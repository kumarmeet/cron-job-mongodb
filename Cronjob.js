const cronJob = require("node-cron");
const moment = require("moment");

const customPromotionTemplateSchema = require("../models/CustomPromotionTemplates");
const userFcmSchema = require("../models/fcmTokens");
const {
  firebaseAdmin,
  pushNotification,
  notificationForCustomPromotion,
} = require("../services/firebaseServices");

const CronJob = async () => {
  let job = cronJob.schedule(
    "* * * * * *",
    async () => {
      const registrationTokens = await userFcmSchema
        .find({}, { token: 1, _id: 0 })
        .lean()
        .then((res) => res.map((t) => t.token).filter((t) => t));

      const data = await customPromotionTemplateSchema
        .find({
          $and: [
            { status: true },
            { startDate: { $lte: new Date() } },
            { endDate: { $gte: new Date() } },
          ],
        })
        .lean()
        .then((res) => {
          return res.map((v) => {
            let diff = moment(moment()).diff(v.startDate, "days");

            // console.log(diff % v.intervals == 0);

            if (diff % v.intervals == 0) {
              return {
                title: v.title,
                body: v.body,
                type: v.type,
                interval: v.intervals,
                hour: moment(v.startDate).format("HH"),
                minute: moment(v.startDate).format("mm"),
                seconds: moment(v.startDate).format("ss"),
              };
            }
          });
        })
        .then((res) => {
          res.map(async (v) => {
            // console.log(res);
            const hour = moment().format("HH");
            const minute = moment().format("mm");
            const second = moment().format("ss");
            // console.log(hour, v.hour, minute, v.minute, second, v.seconds);
            // if (hour == "15" && minute == "30" && second == "14") {
            if (hour == v.hour && minute == v.minute && second == v.seconds) {
              console.log("Fire push notifications");
              await notificationForCustomPromotion(
                registrationTokens,
                { title: v.title, body: v.body },
                { data: "11" }
              );
            }
          });
        });

      // console.log(moment().format("YYYY-MM-DD HH:mm:ss"));
    },
    {
      scheduled: false,
      timezone: "Asia/Kolkata", // replace with Asia/Singapore
    }
  );

  job.start();
};

module.exports = {
  CronJob,
};
