import axios from "axios";
import mongoose from "mongoose";
import { getChannel } from "./rabbitmq.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { publishEmailNotification } from "./email.publisher.js";

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

      // 1. Publish ORDER_CONFIRMATION notification event for customer
      if (order.customerEmail) {
        await publishEmailNotification({
          idempotencyKey: `order_${order._id}_confirmation`,
          type: "ORDER_CONFIRMATION",
          recipient: {
            email: order.customerEmail,
            name: order.customerName || "Customer",
            role: "customer",
          },
          data: {
            orderId: order._id.toString(),
            customerName: order.customerName || "Customer",
            restaurantName: order.restaurantName,
            items: (order.items || []).map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quauntity,
              total: item.price * item.quauntity,
            })),
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            platformFee: order.platfromFee,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress?.fromattedAddress || "",
            customerPhone: order.deliveryAddress?.mobile
              ? String(order.deliveryAddress.mobile)
              : "",
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt
              ? new Date(order.createdAt).toISOString()
              : new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Publish RESTAURANT_NEW_ORDER notification event for restaurant owner
      const restaurant = await Restaurant.findById(order.restaurantId);
      let ownerEmail = restaurant?.ownerEmail;
      let ownerName = restaurant?.ownerName || restaurant?.name;

      if (!ownerEmail && restaurant?.ownerId) {
        try {
          const userDoc = await mongoose.connection.collection("users").findOne({
            $or: [
              { _id: new mongoose.Types.ObjectId(restaurant.ownerId) },
              { _id: restaurant.ownerId as any },
            ],
          });
          if (userDoc?.email) {
            ownerEmail = userDoc.email;
            ownerName = userDoc.name || ownerName;
            // Backfill restaurant document
            await Restaurant.updateOne(
              { _id: restaurant._id },
              { $set: { ownerEmail, ownerName } },
            );
          }
        } catch (lookupErr) {
          console.warn("⚠️ Failed to look up restaurant owner details:", lookupErr);
        }
      }

      if (ownerEmail) {
        await publishEmailNotification({
          idempotencyKey: `order_${order._id}_restaurant_new_order`,
          type: "RESTAURANT_NEW_ORDER",
          recipient: {
            email: ownerEmail,
            name: ownerName || (restaurant ? restaurant.name : "Restaurant Partner"),
            role: "seller",
          },
          data: {
            orderId: order._id.toString(),
            restaurantName: restaurant ? restaurant.name : (order.restaurantName || "Restaurant"),
            items: (order.items || []).map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quauntity,
              total: item.price * item.quauntity,
            })),
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress?.fromattedAddress || "",
            customerPhone: order.deliveryAddress?.mobile
              ? String(order.deliveryAddress.mobile)
              : "",
            orderTime: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          timestamp: new Date().toISOString(),
        });
      }

      channel.ack(msg);
    } catch (err) {
      console.error("❌ Payment consumer error:", err);
      channel.ack(msg); // ack even on error to prevent the message being stuck unacked
    }
  });
};
