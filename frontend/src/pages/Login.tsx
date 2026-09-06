import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";
import { FmmLogo } from "@/components/fmm/logo";
import { Pill } from "@/components/fmm/status-badge";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message || "Login successful");
      setLoading(false);
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("Problem while login");
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm fmm-surface p-6 sm:p-8 space-y-6 text-center shadow-raised">
        <div className="flex justify-center">
          <Pill tone="brand">FindMyMess 2.0</Pill>
        </div>

        <div>
          <FmmLogo size="lg" />
          <p className="mt-2 text-sm text-muted-foreground">
            Log in or sign up to order food, manage your mess or deliver orders.
          </p>
        </div>

        <button
          onClick={() => googleLogin()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground shadow-card transition-all hover:bg-muted/50 hover:shadow-raised disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <FcGoogle size={22} className="shrink-0" />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          By continuing, you agree with our{" "}
          <span className="text-primary font-semibold hover:underline cursor-pointer">
            Terms of Service
          </span>{" "}
          &{" "}
          <span className="text-primary font-semibold hover:underline cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
