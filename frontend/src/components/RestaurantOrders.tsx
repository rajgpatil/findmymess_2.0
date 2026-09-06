import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/quack.mp3";
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "./OrderCard";
import { Bell, Search } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { StatusBadge, type OrderStatus } from "./fmm/status-badge";
import { Money, EmptyState } from "./fmm/primitives";
import { ORDER_ACTIONS } from "../utils/orderflow";
import toast from "react-hot-toast";

interface Props {
  restaurantId: string;
}

const pipelineTabs: { key: string; label: string; statuses?: string[] }[] = [
  { key: "all", label: "All Orders" },
  { key: "new", label: "New", statuses: ["placed"] },
  { key: "preparing", label: "Preparing", statuses: ["accepted", "preparing"] },
  { key: "ready", label: "Ready", statuses: ["ready_for_rider"] },
  {
    key: "picked",
    label: "In Transit",
    statuses: ["rider_assigned", "picked_up"],
  },
  { key: "completed", label: "Completed", statuses: ["delivered"] },
];

const RestaurantOrders = ({ restaurantId }: Props) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          setAudioUnlocked(true);
          toast.success("Sound notifications enabled");
        })
        .catch((err) => {
          console.log("Failed to unlock audio: ", err);
          toast.error("Click again to enable audio");
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("Audio play failed:", err);
        });
      }

      fetchOrders();
      toast("New order received!", { icon: "🔔" });
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  useEffect(() => {
    if (!socket) return;

    const onUpdateOrder = () => {
      fetchOrders();
    };

    socket.on("order:rider_assigned", onUpdateOrder);

    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
    };
  }, [socket]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setActionLoadingId(orderId);
      await axios.put(
        `${restaurantService}/api/order/${orderId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success(`Order marked as ${status.replaceAll("_", " ")}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const idMatches = o._id.toLowerCase().includes(q);
    const itemMatches = o.items.some((item) =>
      item.name.toLowerCase().includes(q),
    );
    return idMatches || itemMatches;
  });

  if (loading) {
    return (
      <div className="space-y-4 py-8 text-center text-muted-foreground">
        <p>Loading restaurant orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!audioUnlocked && (
        <Alert className="border-info/30 bg-info-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-info shrink-0" />
            <div>
              <AlertTitle className="text-info font-bold">
                Enable sound notifications
              </AlertTitle>
              <AlertDescription className="text-info/80 text-xs sm:text-sm">
                Get an audible alert whenever a new incoming order arrives.
              </AlertDescription>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="shrink-0 bg-surface"
            onClick={unlockAudio}
          >
            Enable sound
          </Button>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 shadow-xs">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or dish name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 px-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>
      </div>

      {/* Pipeline Tabs */}
      <Tabs defaultValue="all">
        <div className="fmm-scroll-x">
          <TabsList className="bg-surface border border-border">
            {pipelineTabs.map((t) => {
              const count = t.statuses
                ? filteredOrders.filter((o) => t.statuses!.includes(o.status))
                    .length
                : filteredOrders.length;
              return (
                <TabsTrigger key={t.key} value={t.key} className="gap-2">
                  {t.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {pipelineTabs.map((t) => {
          const tabOrders = t.statuses
            ? filteredOrders.filter((o) => t.statuses!.includes(o.status))
            : filteredOrders;

          return (
            <TabsContent key={t.key} value={t.key} className="pt-4 space-y-4">
              {tabOrders.length === 0 ? (
                <EmptyState
                  title={`No ${t.label.toLowerCase()} orders`}
                  description="Orders progressing through this stage will automatically show up here."
                />
              ) : (
                <>
                  {/* Mobile & Tablet Card Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                    {tabOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        onStatusUpdate={fetchOrders}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="fmm-surface hidden overflow-hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-surface-muted">
                          <TableHead>Order ID</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabOrders.map((o) => {
                          const actions = ORDER_ACTIONS[o.status] || [];
                          return (
                            <TableRow key={o._id}>
                              <TableCell className="font-mono font-bold">
                                #{o._id.slice(-6).toUpperCase()}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground">
                                {o.items
                                  .map((it) => `${it.name} x${it.quauntity}`)
                                  .join(", ")}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(o.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={o.status as OrderStatus} />
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                <Money amount={o.totalAmount} />
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="flex justify-end gap-2">
                                  {o.paymentStatus === "paid" &&
                                    actions.map((act) => (
                                      <Button
                                        key={act}
                                        size="sm"
                                        disabled={actionLoadingId === o._id}
                                        onClick={() =>
                                          updateOrderStatus(o._id, act)
                                        }
                                      >
                                        {act.replaceAll("_", " ")}
                                      </Button>
                                    ))}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default RestaurantOrders;
