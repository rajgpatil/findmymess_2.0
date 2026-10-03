import { ConsumeMessage } from "amqplib";
import { getChannel, NOTIFICATION_QUEUE } from "../config/rabbitmq.js";
import { renderTemplate, sendEmail } from "../services/email.service.js";

export interface EmailNotificationEvent {
  idempotencyKey: string;
  type:
    | "ORDER_CONFIRMATION"
    | "RESTAURANT_NEW_ORDER"
    | "RIDER_ORDER_ASSIGNED"
    | "ORDER_STATUS_UPDATE";
  recipient: {
    email: string;
    name: string;
    role: "customer" | "seller" | "rider";
  };
  data: Record<string, any>;
  timestamp: string;
}

// In-memory idempotency cache (stores keys with expiration to avoid memory leaks)
const processedKeys = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 5000;

const isAlreadyProcessed = (key: string): boolean => {
  const now = Date.now();
  const entry = processedKeys.get(key);
  if (entry && now - entry < IDEMPOTENCY_TTL_MS) {
    return true;
  }
  return false;
};

const markAsProcessed = (key: string): void => {
  if (processedKeys.size > MAX_CACHE_SIZE) {
    const oldestKey = processedKeys.keys().next().value;
    if (oldestKey) processedKeys.delete(oldestKey);
  }
  processedKeys.set(key, Date.now());
};

const isValidEmail = (email?: string): boolean => {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const startEmailConsumer = async (): Promise<void> => {
  const channel = getChannel();
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized before starting email consumer");
  }

  console.log(`👂 Listening for email notification events on "${NOTIFICATION_QUEUE}"...`);

  channel.consume(NOTIFICATION_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content) as EmailNotificationEvent;

      const { idempotencyKey, type, recipient, data } = event;

      // 1. Idempotency Check
      if (idempotencyKey && isAlreadyProcessed(idempotencyKey)) {
        console.log(`⚠️ Skipping duplicate notification event: ${idempotencyKey}`);
        channel.ack(msg);
        return;
      }

      // 2. Recipient Email Validation
      if (!isValidEmail(recipient?.email)) {
        console.warn(`⚠️ Dropping notification event [${type}] with invalid recipient email: "${recipient?.email}"`);
        channel.ack(msg);
        return;
      }

      console.log(`📨 Processing notification event [${type}] for recipient ${recipient.email}...`);

      let templateName = "";
      let subject = "";

      switch (type) {
        case "ORDER_CONFIRMATION": {
          templateName = "user-order-confirmation";
          subject = `Order Confirmed! Your order #${data.orderId} has been placed`;
          break;
        }
        case "RESTAURANT_NEW_ORDER": {
          templateName = "restaurant-new-order";
          subject = `New Order Received: #${data.orderId}`;
          break;
        }
        case "RIDER_ORDER_ASSIGNED": {
          templateName = "rider-order-assigned";
          subject = `New Delivery Assignment: Order #${data.orderId}`;
          break;
        }
        case "ORDER_STATUS_UPDATE": {
          templateName = "user-order-status";
          const statusText = data.statusTitle || data.status || "Updated";
          subject = `Order Update: Your order is now ${statusText}`;
          break;
        }
        default: {
          console.warn(`⚠️ Unknown notification event type: "${type}". Acknowledging message.`);
          channel.ack(msg);
          return;
        }
      }

      // 3. Render EJS HTML Template
      const html = await renderTemplate(templateName, {
        ...data,
        recipient,
        type,
        currentYear: new Date().getFullYear(),
      });

      // 4. Dispatch Email via Resend
      await sendEmail({
        to: recipient.email,
        subject,
        html,
      });

      // 5. Mark as processed & Acknowledge
      if (idempotencyKey) {
        markAsProcessed(idempotencyKey);
      }
      channel.ack(msg);
      console.log(`✅ Successfully processed & sent email [${type}] to ${recipient.email}`);
    } catch (err: any) {
      console.error("❌ Error in notification consumer:", err?.message || err);

      const retryCount = (msg.properties.headers?.["x-retry-count"] as number) || 0;
      const MAX_RETRIES = 3;

      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        console.log(`🔄 Re-queueing message for retry (${nextRetry}/${MAX_RETRIES})...`);
        setTimeout(() => {
          channel.sendToQueue(NOTIFICATION_QUEUE, msg.content, {
            headers: {
              ...msg.properties.headers,
              "x-retry-count": nextRetry,
            },
            persistent: true,
          });
          channel.ack(msg);
        }, 3000 * nextRetry);
      } else {
        console.error(`🚨 Message exceeded max retries (${MAX_RETRIES}). Acknowledging to avoid blocking queue.`);
        channel.ack(msg);
      }
    }
  });
};
