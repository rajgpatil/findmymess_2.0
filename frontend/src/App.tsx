import Home from "./pages/Home";
import Login from "./pages/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SelectRole from "./pages/SelectRole";
import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/protectedRote";
import { useAppData } from "./context/AppContext";
import Navbar from "./components/navbar";
import Account from "./pages/Account";
const App = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <h1 className="text-2xl font-bold text-red-500 text-center mt-56">
        Loading...
      </h1>
    );
  }
  return (
    <>
      <BrowserRouter>
          <Navbar />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
};

export default App;
