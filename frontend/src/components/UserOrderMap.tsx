import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { useEffect } from "react";
import { Bike } from "lucide-react";

declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options?: any): any;
  }
}

const riderIcon = new L.DivIcon({
  html: '<div style="background-color: var(--primary, #E23744); width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 2px solid white; font-size: 18px;">🛵</div>',
  iconSize: [34, 34],
  className: "custom-rider-icon",
});

const deliveryIcon = new L.DivIcon({
  html: '<div style="background-color: #10B981; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 2px solid white; font-size: 18px;">📍</div>',
  iconSize: [34, 34],
  className: "custom-delivery-icon",
});

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
        styles: [{ color: "#E23744", weight: 5, opacity: 0.85 }],
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

interface Props {
  riderLocation: [number, number];
  deliveryLocation: [number, number];
}

const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {
  return (
    <div className="fmm-surface overflow-hidden shadow-raised">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Bike className="size-4 text-primary" />
          <span>Live Rider GPS Route</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-bold text-success">
          <span className="size-1.5 rounded-full bg-current animate-ping" />
          Live
        </span>
      </div>

      <div className="relative h-72 sm:h-96 w-full">
        <MapContainer
          center={riderLocation}
          zoom={14}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>Delivery Partner (Rider)</Popup>
          </Marker>
          <Marker position={deliveryLocation} icon={deliveryIcon}>
            <Popup>Your Delivery Address</Popup>
          </Marker>
          <Routing from={riderLocation} to={deliveryLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default UserOrderMap;
