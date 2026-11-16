const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const adminEmailParam = defineString("GHEPARDO_ADMIN_EMAIL", {
  description: "Exact email address of the single GHEPARDO owner account"
});

const catalog = {
  1: { title: "Factory Live Production Dashboard", price: 750 },
  2: { title: "GHEPARDO Executive Notion OS", price: 350 },
  3: { title: "Smart Inventory & Kanban Excel System", price: 490 },
  4: { title: "Personal Wealth & Investment Tracker", price: 290 }
};

exports.claimGhepardoAdmin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before requesting administrator access.");
  }

  const configuredEmail = adminEmailParam.value().trim().toLowerCase();
  const signedInEmail = String(request.auth.token.email || "").trim().toLowerCase();

  if (!configuredEmail || signedInEmail !== configuredEmail || request.auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "This account is not authorized as the GHEPARDO owner.");
  }

  const auth = getAuth();
  const user = await auth.getUser(request.auth.uid);
  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true
  });

  return { success: true };
});

exports.createGhepardoOrder = onCall({ region: "europe-west1" }, async (request) => {
  const data = request.data || {};
  const name = typeof data.customerName === "string" ? data.customerName.trim() : "";
  const contact = typeof data.contact === "string" ? data.contact.trim() : "";
  const paymentReference = typeof data.paymentReference === "string" ? data.paymentReference.trim() : "";
  const requestedItems = Array.isArray(data.items) ? data.items : [];

  if (name.length < 2 || name.length > 100 || contact.length < 5 || contact.length > 120 ||
      paymentReference.length < 1 || paymentReference.length > 120 ||
      requestedItems.length < 1 || requestedItems.length > 20) {
    throw new HttpsError("invalid-argument", "Please check your order details.");
  }

  const items = requestedItems.map((item) => {
    const product = catalog[Number(item && item.id)];
    if (!product) throw new HttpsError("invalid-argument", "An item is not available.");
    return { title: product.title, price: product.price };
  });
  const totalEGP = items.reduce((sum, item) => sum + item.price, 0);

  const result = await getDatabase().ref("orders").push({
    customerName: name,
    contact,
    paymentReference,
    items,
    totalEGP,
    status: "pending",
    timestampMs: Date.now()
  });

  return { orderId: result.key, totalEGP, items };
});

exports.subscribeGhepardoNewsletter = onCall({ region: "europe-west1" }, async (request) => {
  const email = typeof (request.data || {}).email === "string"
    ? request.data.email.trim().toLowerCase()
    : "";

  if (email.length > 254 || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid email address.");
  }

  const result = await getDatabase().ref("subscribers").push({
    email,
    timestampMs: Date.now()
  });

  return { subscriberId: result.key };
});
