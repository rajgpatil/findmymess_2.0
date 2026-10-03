import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY environment variable is not defined");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "FindMyMess <onboarding@resend.dev>";
