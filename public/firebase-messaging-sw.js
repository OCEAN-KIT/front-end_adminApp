// eslint-disable no-undef
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCydG1oH2gWlC7zp1RgLjZUgiDaPC0uXME",
  authDomain: "piuda-bfb0f.firebaseapp.com",
  projectId: "piuda-bfb0f",
  messagingSenderId: "137988483909",
  appId: "1:137988483909:web:34203cf1e3109d4188ec2c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(({ notification }) => {
  if (!notification) return;
  const { title, body, image } = notification;
  self.registration.showNotification(title || "알림", {
    body,
    icon: image || "/icon-192.png",
    data: notification,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.click_action || "/";
  event.waitUntil(clients.openWindow(url));
});
