const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

const adminEmailParam = defineString("GHEPARDO_ADMIN_EMAIL", {
  description: "Exact email address of the single GHEPARDO owner account"
});

exports.claimGhepardoAdmin = onCall(
  { region: "europe-west1", enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before requesting administrator access.");
    }

    const token = request.auth.token;
    const configuredEmail = adminEmailParam.value().trim().toLowerCase();
    const signedInEmail = String(token.email || "").trim().toLowerCase();

    if (!configuredEmail || signedInEmail !== configuredEmail || token.email_verified !== true) {
      throw new HttpsError("permission-denied", "This account is not authorized as the GHEPARDO owner.");
    }

    const user = await getAuth().getUser(request.auth.uid);
    await getAuth().setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      admin: true
    });

    return { success: true, message: "Administrator role assigned. Refresh your ID token to continue." };
  }
);
