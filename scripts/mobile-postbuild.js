const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appDir = path.join(root, "web", "src", "app");
const srcDir = path.join(root, "web", "src");

const apiBackup = path.join(srcDir, "_api-mobile-backup");
const apiDir = path.join(appDir, "api");

const dashboardBackup = path.join(srcDir, "_dashboard-mobile-backup");
const dashboardDir = path.join(appDir, "dashboard");

const rootPage = path.join(appDir, "page.tsx");
const rootPageBackup = path.join(srcDir, "_page-mobile-backup.tsx");

if (fs.existsSync(apiBackup) && !fs.existsSync(apiDir)) {
  fs.renameSync(apiBackup, apiDir);
  console.log("mobile-postbuild: restored web/src/app/api");
}

if (fs.existsSync(dashboardBackup) && !fs.existsSync(dashboardDir)) {
  fs.renameSync(dashboardBackup, dashboardDir);
  console.log("mobile-postbuild: restored web/src/app/dashboard");
}

if (fs.existsSync(rootPageBackup)) {
  if (fs.existsSync(rootPage)) fs.unlinkSync(rootPage);
  fs.renameSync(rootPageBackup, rootPage);
  console.log("mobile-postbuild: restored web/src/app/page.tsx");
}

