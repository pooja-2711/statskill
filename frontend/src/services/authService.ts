import api from "./api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
}

export async function registerUser(data: {
  full_name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await api.post("/users/register", data);
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<string> {
  const res = await api.post("/auth/login", { email, password });
  return res.data.access_token;
}

export async function getMyProfile(): Promise<User> {
  const res = await api.get("/users/me");
  return res.data;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await api.get("/health");
  return res.data;
}

export async function getWelcome(): Promise<{ message: string; status: string }> {
  const res = await api.get("/");
  return res.data;
}