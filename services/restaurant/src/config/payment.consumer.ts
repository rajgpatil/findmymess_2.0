import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import Order from "../models/Order.js";

export const startPaymentConsumer = async () => {
  const channel = getChannel();
  channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());

      if (event.type !== "PAYMENT_SUCCESS") {
        channel.ack(msg);
        return;
      }
      const { orderId } = event.data;

      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          paymentStatus: { $ne: "paid" },
        },
        {
          $set: {
            paymentStatus: "paid",
            status: "placed",
          },
          $unset: {
            expiresAt: 1,
          },
        },
        { new: true },
      );
      if (!order) {
        channel.ack(msg);
        return;
      }
      console.log("✅Order Placed:", order._id);
      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant:${order.restaurantId}`,
          payload: {
            orderId: order._id,
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );
      channel.ack(msg);
    } catch (err) {
      console.error("❌ Payment consumer error:", err);
      channel.ack(msg); // ack even on error to prevent the message being stuck unacked
    }
  });
};
