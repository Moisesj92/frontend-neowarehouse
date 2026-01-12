import axios from "axios";

const API_SECRET = import.meta.env.VITE_API_SECRET || "";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function strToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

axiosInstance.interceptors.request.use(async (config) => {
  const timestamp = Date.now().toString();
  const method = config.method?.toUpperCase() || "";
  const url = config.url || "";
  const body = config.data ? JSON.stringify(config.data) : "";

  const message = `${method}:${url}:${timestamp}:${body}`;

  const key = await window.crypto.subtle.importKey(
    "raw",
    strToArrayBuffer(API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    "HMAC",
    key,
    strToArrayBuffer(message)
  );
  const signature = bufferToHex(signatureBuffer);

  config.headers?.set?.("Authorization", `HMAC ${timestamp}:${signature}`);

  return config;
});

export default axiosInstance;
