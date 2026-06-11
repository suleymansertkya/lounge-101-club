import { Server } from "socket.io";

const io = new Server(3000, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("mesaj_gonder", (data) => {
    // Mesajı herkese yay (Broadcast)
    io.emit("yeni_mesaj", {
      isim: data.oyuncu.isim,
      icerik: data.mesaj,
    });
  });
});

console.log("🚀 LOUNGE 101 SUNUCU AKTİF! (Port: 3000)");