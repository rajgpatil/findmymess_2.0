import Home from "./pages/Home";
import Login from "./pages/Login";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SelectRole from "./pages/SelectRole";
import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/protectedRote";
import { useAppData } from "./context/AppContext";
import Account from "./pages/Account";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";
import { FmmLogo } from "./components/fmm/logo";

const App = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted gap-4">
        <div className="animate-pulse">
          <FmmLogo size="lg" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Starting FindMyMess...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user && user.role === "seller" ? (
        <Routes>
          <Route path="/" element={<Restaurant />} />
          <Route path="/account" element={<Account />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : user && user.role === "rider" ? (
        <Routes>
          <Route path="/" element={<RiderDashboard />} />
          <Route path="/rider" element={<RiderDashboard />} />
          <Route path="/account" element={<Account />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : user && user.role === "admin" ? (
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/address" element={<AddAddressPage />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/account" element={<Account />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/paymentsuccess/:paymentId"
              element={<PaymentSuccess />}
            />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
