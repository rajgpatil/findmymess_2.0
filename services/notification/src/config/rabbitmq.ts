import dotenv from "dotenv";
dotenv.config();
import amqp from "amqplib";

let channel: amqp.Channel;

export const NOTIFICATION_QUEUE =
  process.env.NOTIFICATION_QUEUE || "notification_email_queue";

export const connectRabbitMQ = async (): Promise<amqp.Channel> => {
  const rabbitUrl =
    process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672";

  const connection = await amqp.connect(rabbitUrl);
  channel = await connection.createChannel();

  await channel.assertQueue(NOTIFICATION_QUEUE, {
    durable: true,
  });

  // Fair dispatch: prevent prefetching more than 5 messages at once
  await channel.prefetch(5);

  console.log("🐇 Connected to RabbitMQ (notification service)");
  console.log(`📦 Queue asserted: ${NOTIFICATION_QUEUE}`);

  return channel;
};

export const getChannel = (): amqp.Channel => channel;
