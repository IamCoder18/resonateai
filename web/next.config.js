/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-auth", "pg", "nodemailer"],
};

module.exports = nextConfig;
