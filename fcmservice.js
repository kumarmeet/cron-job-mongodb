const firebaseAdmin = require("firebase-admin");

const firebaseServiceAccount = require("../joompa-firebas-firebase-adminsdk-advpa-75f5852aec.json");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
});

const fcmTokens = require("../models/fcmTokens");
const fcmTokensTemplates = require("../models/fcmTemplates");
const userNotifications = require("../models/userNotificationSettingSchema");
const userSaveNotifications = require("../models/userNotificationSchema");

const getTemplate = async (event, data = {}) => {
  const templ = await fcmTokensTemplates.findOne({ type: event });

  const parsedUserData = JSON.parse(data);

  let body = "Hello Joompa Default Message!";
  let title = "Hello Joompa Default Title";

  if (event === "match") {
    title = templ.title;
    body = templ.body.replace("{name}", parsedUserData.data.fullName);
  }

  if (event === "messages") {
    title = templ.title.replace("{userName}", parsedUserData.data.fullName);
    body = templ.body.replace("{message}", parsedUserData.data.message);
  }

  const result = {
    title: title,
    body: body,
    data: { data, type: event },
  };

  return result;
};

//use this service to send push notification on a particular event
const pushNotification = async (type, to, data) => {
  const { pushNotification, inAppNotification } = await userNotifications(
    { userId: to },
    { pushNotification: 1, inAppNotification: 1 }
  );

  const { newMatches, messages, subscription } = pushNotification;

  //typecast boolean to string for fcm data validation (FirebaseMessagingError if messaging payload not contains only string)
  const finalData = JSON.stringify({
    ...data,
    pushNotification,
    inAppNotification,
  });

  const message = await getTemplate(type, finalData);

  //send push notifications by notification setting wise
  if (newMatches) {
    await notificaionConfig(to, message.title, message.body, message.data);
    await userSaveNotifications.create({
      userId: data.data.id,
      title: message.title,
      description: message.body,
      type: type,
      dateAndTime: new Date(),
    });
  } else if (messages) {
    await notificaionConfig(to, message.title, message.body, message.data);
  } else if (subscription) {
    await notificaionConfig(to, message.title, message.body, message.data);
  }
};

const notificaionConfig = async (user, title, description, data = {}) => {
  const registrationTokens = await fcmTokens
    .find({ userId: user }, { token: 1 })
    .lean()
    .then((tokens) => {
      return tokens.map((v) => v.token);
    });

  // dmEPTYV3SgmiPsoAr142jr:APA91bEjud2ANHsD8OxJhSFCE4FNalUq4EuX9FLevddr1f2guLKDbIXaLWbZYRxz0XnS2Xs2WJ3JVuwNiXp-HiUi7v45DaVCgdeTia6o5RyZ9ysyupJ0Ah3bvIdSI50T78QQ-mdR9Nvk
  for (const fcmToken of registrationTokens) {
    firebaseAdmin
      .messaging()
      .sendToDevice(
        fcmToken,
        {
          notification: { title, body: description, data: "{test:true}" },
          data: data,
        },
        {
          priority: "high",
          timeToLive: 60 * 60 * 24,
        }
      )
      .then((response) => {
        console.log(response);
        console.log("Notification sent successfully");
      })
      .catch((err) => {
        console.log(err);
        throw new Error("Send to device error occurred!");
      });
  }
  return true;
};

const notificationForCustomPromotion = async (
  registrationTokens,
  payload,
  completeData
) => {
  const message = {
    tokens: registrationTokens,
    notifications: { ...payload.notification, completeData },
  };

  console.log(registrationTokens, payload, completeData);

  await firebaseAdmin
    .messaging()
    .sendMulticast(message)
    .then((resposne) => {
      console.log(resposne);
      console.log("Notifications sent successfully");
    })
    .catch((err) => {
      console.log(err);
      throw new Error("Send multicast error occurred!");
    });
};

module.exports = {
  firebaseAdmin,
  pushNotification,
  notificationForCustomPromotion,
};
