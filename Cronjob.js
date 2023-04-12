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
      moment.suppressDeprecationWarnings = true; // for removing warnings of moments
      makeInactiveUser();
      refillFreeMessageForUsers();
      expireConcerge();
      sendNotificationByLiked();
      sendNotificationsBeforeTwoHourToUser();
      expirePassportPackage();
      sendNotificationToExpirePlan();
      // updateFinshLimit();

      const registrationTokens = await userFcmSchema
        .find({}, { token: 1, _id: 0 })
        .lean()
        .then((res) => res.map((t) => t.token).filter((t) => t));

      // console.log(registrationTokens);

      await customPromotionTemplateSchema
        .find({
          //here filter date and time by present date and time
          $and: [
            { status: true },
            { startDate: { $lte: new Date() } },
            { endDate: { $gte: new Date() } },
          ],
        })
        .lean()
        .then((res) => {
          // console.log(res);
          res &&
            res.length &&
            res.map(async (v) => {
              let diff = moment(moment()).diff(v.startDate, "days");

              // console.log(moment(v.startDate).format("YYYY-MM-DD HH:mm:ss"));

              const hour = moment().format("HH");
              const minute = moment().format("mm");
              const second = moment().format("ss");

              const h = moment(v.startDate).format("HH");
              const m = moment(v.startDate).format("mm");
              const s = moment(v.startDate).format("ss");

              // console.log(diff, diff % v.intervals == 0, hour == h && minute == m && second == s);

              // console.log(hour, h, minute, m, second, s);

              if (
                diff % v.intervals == 0 &&
                hour == h &&
                minute == m &&
                second == s
              ) {
                console.log("Custom promotion sent");

                await notificationForCustomPromotion(
                  registrationTokens,
                  { title: v.title, body: v.body },
                  JSON.stringify({ type: v.type })
                );
              }
            });
        });

      // console.log(moment().format("YYYY-MM-DD HH:mm:ss"));
    },
    {
      scheduled: false,
      timezone: "Asia/Singapore",
    }
  );

  job.start();
};

module.exports = {
  CronJob,
};
