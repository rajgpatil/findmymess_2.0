import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { resend, EMAIL_FROM } from "../config/resend.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find templates directory across development (ts-node) and production (dist)
const getTemplatesDir = (): string => {
  const candidatePaths = [
    path.resolve(__dirname, "../templates"),
    path.resolve(__dirname, "../../src/templates"),
    path.resolve(process.cwd(), "src/templates"),
    path.resolve(process.cwd(), "dist/templates"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to default
  return path.resolve(__dirname, "../templates");
};

const DEFAULT_TEMPLATE_DATA: Record<string, any> = {
  orderId: "",
  customerName: "Customer",
  customerPhone: "",
  restaurantName: "Restaurant",
  restaurantAddress: "",
  restaurantPhone: "",
  riderName: "Delivery Partner",
  riderPhone: "",
  riderAmount: 0,
  distance: 0,
  deliveryAddress: "",
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  platformFee: 7,
  totalAmount: 0,
  status: "placed",
  statusTitle: "Order Update",
  statusMessage: "",
  paymentMethod: "Online",
  orderTime: "Just now",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  currentYear: new Date().getFullYear(),
};

export const renderTemplate = async (
  templateName: string,
  data: Record<string, any>,
): Promise<string> => {
  const templatesDir = getTemplatesDir();
  const filePath = path.join(templatesDir, `${templateName}.ejs`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template not found: ${filePath}`);
  }

  // Pass templatesDir so include('layout/header') can resolve properly
  const html = await ejs.renderFile(
    filePath,
    {
      ...DEFAULT_TEMPLATE_DATA,
      ...data,
      root: templatesDir,
    },
    {
      root: templatesDir,
      views: [templatesDir],
    },
  );

  return html;
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ id: string }> => {
  // If in development and an override email is specified, redirect test emails
  const targetEmail = process.env.RESEND_DEV_OVERRIDE_EMAIL || to;

  console.log(`🚀 Dispatching email via Resend to: ${targetEmail} | Subject: "${subject}"`);

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [targetEmail],
    subject,
    html,
  });

  if (error) {
    console.error("❌ Resend API returned error:", error);
    throw new Error(`Resend Error: ${error.message}`);
  }

  if (!data || !data.id) {
    throw new Error("Resend response missing dispatch ID");
  }

  console.log(`✉️ Email successfully dispatched to ${targetEmail}. Resend ID: ${data.id}`);
  return { id: data.id };
};
