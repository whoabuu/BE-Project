import api from "./api";

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function register(data: RegisterData) {
  const response = await api.post("/auth/register", data);

  const { token } = response.data;

  localStorage.setItem("talentbridge_token", token);

  return response.data;
}

export async function login(data: LoginData) {
  const response = await api.post("/auth/login", data);

  const { token } = response.data;

  localStorage.setItem("talentbridge_token", token);

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");

  return response.data;
}

export function logout() {
  localStorage.removeItem("talentbridge_token");
}