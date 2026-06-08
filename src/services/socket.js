import { io } from "socket.io-client";

let socket = null;


// ================= CONNECT SOCKET =================

export const connectSocket = (userId) => {

  if (!socket) {

    socket = io("import.meta.env.VITE_API_URL", {

      query: {
        userId
      },

      transports: ["websocket"]

    });

    socket.on("connect", () => {

      console.log(
        "✅ Socket Connected:",
        socket.id
      );

    });

  }

  return socket;
};


// ================= GET SOCKET =================

export const getSocket = () => socket;


// ================= DISCONNECT SOCKET =================

export const disconnectSocket = () => {

  if (socket) {

    socket.disconnect();

    socket = null;

    console.log("❌ Socket Disconnected");

  }
};