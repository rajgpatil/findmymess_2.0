import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startEmailConsumer } from "./consumers/email.consumer.js";
import { renderTemplate, sendEmail } from "./services/email.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "notification",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Direct test endpoint for template rendering / testing Resend email dispatch
app.post("/api/notification/test", async (req: Request, res: Response) => {
  const internalKey = req.headers["x-internal-key"];
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev && internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { to, templateName, data, subject } = req.body;

  if (!to || !templateName) {
    return res.status(400).json({
      message: "Both 'to' and 'templateName' are required.",
    });
  }

  try {
    const html = await renderTemplate(templateName, {
      ...(data || {}),
      currentYear: new Date().getFullYear(),
    });

    const result = await sendEmail({
      to,
      subject: subject || `Test Email: ${templateName}`,
      html,
    });

    res.json({
      success: true,
      message: "Test email dispatched successfully",
      resendId: result.id,
    });
  } catch (err: any) {
    console.error("❌ Test email dispatch error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to dispatch email",
    });
  }
});

const startServer = async () => {
  try {
    console.log("🚀 Starting Notification Microservice...");

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start consuming email events
    await startEmailConsumer();

    app.listen(PORT, () => {
      console.log(`⚡ Notification Service listening on ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Notification Service startup failed:", error);
    process.exit(1);
  }
};

startServer();
