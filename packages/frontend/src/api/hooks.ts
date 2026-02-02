import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

export function usePatients() {
  return useQuery(["patients"], async () => {
    const { data } = await api.get("/patients");
    return data;
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation((payload: any) => api.post("/patients", payload), {
    onSuccess: () => qc.invalidateQueries(["patients"])
  });
}

export function useLogin() {
  return useMutation(async (creds: { email: string; password: string }) => {
    const { data } = await api.post("/auth/login", creds);
    localStorage.setItem("hms_token", data.token);
    localStorage.setItem("hms_user", JSON.stringify(data.user));
    return data;
  });
}
