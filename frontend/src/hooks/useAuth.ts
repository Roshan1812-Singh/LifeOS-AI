import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService, type LoginPayload, type RegisterPayload } from "@/services/authService";
import { extractErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setSession(data);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      navigate("/dashboard");
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Login failed")),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      setSession(data);
      toast.success("Account created. Welcome to LifeOS AI!");
      navigate("/dashboard");
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Registration failed")),
  });
}

export function useLogout() {
  const { refreshToken, clear } = useAuthStore.getState();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authService.logout(refreshToken).catch(() => undefined);
      }
    },
    onSettled: () => {
      clear();
      navigate("/login");
    },
  });
}
