import { getChannel, NOTIFICATION_QUEUE } from "./rabbitmq.js";

export interface EmailNotificationEvent {
  idempotencyKey: string; // e.g. "order_65f1a2b3_status_accepted"
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

export const publishEmailNotification = async (
  event: EmailNotificationEvent,
): Promise<void> => {
  try {
    const channel = getChannel();
    if (!channel) {
      console.warn("⚠️ RabbitMQ channel not available for email notification");
      return;
    }

    channel.sendToQueue(
      NOTIFICATION_QUEUE,
      Buffer.from(JSON.stringify(event)),
      { persistent: true },
    );
    console.log(
      `📨 Email event [${event.type}] published to queue for ${event.recipient.email}`,
    );
  } catch (error) {
    console.error("❌ Failed to publish email notification event:", error);
  }
};
