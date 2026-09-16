import type { NextConfig } from "next";
const config: NextConfig = { devIndicators: false, serverExternalPackages: ["better-auth", "pdf-parse", "mammoth", "nodemailer"] };
export default config;
