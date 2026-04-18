const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ── Join an auction room ───────────────────────────────
    socket.on("joinAuction", ({ auctionId, userId }) => {
      socket.join(`auction_${auctionId}`);

      const room = io.sockets.adapter.rooms.get(`auction_${auctionId}`);
      const totalViewers = room ? room.size : 0;

      console.log(
        `User joined auction room: auction_${auctionId} (viewers: ${totalViewers})`,
      );

      // Notify others in the room
      socket.to(`auction_${auctionId}`).emit("userJoined", {
        userId,
        totalViewers,
      });
    });

    // ── Leave an auction room ──────────────────────────────
    socket.on("leaveAuction", ({ auctionId }) => {
      socket.leave(`auction_${auctionId}`);
      console.log(`User left auction room: auction_${auctionId}`);
    });

    // ── Disconnect ─────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler;
