import type { IOrder } from "../types";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";
import { realtimeService } from "../main";
import { Navigation, Compass } from "lucide-react";

declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options?: any): any;
  }
}

const riderIcon = new L.DivIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#e23744;color:white;border-radius:9999px;box-shadow:0 4px 12px rgba(226,55,68,0.4);border:2px solid white;font-size:18px;">🛵</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#16a34a;color:white;border-radius:9999px;box-shadow:0 4px 12px rgba(22,163,74,0.4);border:2px solid white;font-size:18px;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: "",
});

interface Props {
  order: IOrder;
}

const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();

  useEffect(() => {
    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: {
        styles: [{ color: "#e23744", weight: 5, opacity: 0.85 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [from, to, map]);

  return null;
};

const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );

  if (
    order.deliveryAddress.latitude == null ||
    order.deliveryAddress.longitude == null
  ) {
    return null;
  }

  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  useEffect(() => {
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          setRiderLocation([latitude, longitude]);

          axios.post(
            `${realtimeService}/api/v1/internal/emit`,
            {
              event: "rider:location",
              room: `user:${order.userId}`,
              payload: { latitude, longitude },
            },
            {
              headers: {
                "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
              },
            },
          );
        },
        (err) => console.log("Location Error:", err),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [order.userId]);

  if (!riderLocation) return null;

  return (
    <div className="fmm-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-surface-muted/50">
        <div className="flex items-center gap-2">
          <Navigation className="size-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-foreground">
            Live Delivery Route
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Compass className="size-3.5 text-success" />
          <span>GPS Active</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <MapContainer center={riderLocation} zoom={14} className="size-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>You (Rider Live Position)</Popup>
          </Marker>
          <Marker position={deliveryLocation} icon={deliveryIcon}>
            <Popup>Customer Drop Location</Popup>
          </Marker>
          <Routing from={riderLocation} to={deliveryLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default RiderOrderMap;
