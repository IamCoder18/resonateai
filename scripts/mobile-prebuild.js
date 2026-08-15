const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appDir = path.join(root, "web", "src", "app");
const srcDir = path.join(root, "web", "src");

const apiDir = path.join(appDir, "api");
const apiBackup = path.join(srcDir, "_api-mobile-backup");

const dashboardDir = path.join(appDir, "dashboard");
const dashboardBackup = path.join(srcDir, "_dashboard-mobile-backup");

const rootPage = path.join(appDir, "page.tsx");
const rootPageBackup = path.join(srcDir, "_page-mobile-backup.tsx");

if (fs.existsSync(apiBackup)) {
  die(
    `refusing to run: ${apiBackup} already exists from a previous run. ` +
      `If that previous build completed, run 'npm run mobile:postbuild' to restore. ` +
      `If it was interrupted, inspect the backup and remove it before retrying.`,
  );
}

if (fs.existsSync(dashboardBackup)) {
  die(
    `refusing to run: ${dashboardBackup} already exists from a previous run. ` +
      `If that previous build completed, run 'npm run mobile:postbuild' to restore. ` +
      `If it was interrupted, inspect the backup and remove it before retrying.`,
  );
}

if (fs.existsSync(rootPageBackup)) {
  die(
    `refusing to run: ${rootPageBackup} already exists from a previous run. ` +
      `If that previous build completed, run 'npm run mobile:postbuild' to restore. ` +
      `If it was interrupted, inspect the backup and remove it before retrying.`,
  );
}

if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackup);
  console.log("mobile-prebuild: moved web/src/app/api → web/src/_api-mobile-backup");
}

if (fs.existsSync(dashboardDir)) {
  fs.renameSync(dashboardDir, dashboardBackup);
  console.log("mobile-prebuild: moved web/src/app/dashboard → web/src/_dashboard-mobile-backup");
}

if (fs.existsSync(rootPage)) {
  fs.renameSync(rootPage, rootPageBackup);
  fs.writeFileSync(
    rootPage,
    `"use client";\n` +
    `import { useEffect } from "react";\n` +
    `import { useRouter } from "next/navigation";\n` +
    `export default function Page() {\n` +
    `  const router = useRouter();\n` +
    `  useEffect(() => { router.replace("/app"); }, [router]);\n` +
    `  return null;\n` +
    `}\n`,
  );
  console.log("mobile-prebuild: stubbed web/src/app/page.tsx (mobile root → /app)");
}

function die(msg) {
  console.error(`mobile-prebuild: ${msg}`);
  process.exit(1);
}

