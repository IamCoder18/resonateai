/** @type {import('next').NextConfig} */
const isMobile = process.env.BUILD_TARGET === "mobile";

const baseConfig = {
  serverExternalPackages: ["better-auth", "pg", "nodemailer"],
};

const webConfig = {
  ...baseConfig,
  output: "standalone",
};

const mobileConfig = {
  ...baseConfig,
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/app",
        permanent: false,
      },
    ];
  },
};

module.exports = isMobile ? mobileConfig : webConfig;
