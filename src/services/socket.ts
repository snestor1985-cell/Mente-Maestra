import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(); // Connects to same host/port by default
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room methods
  createRoom(userName: string) {
    this.socket?.emit("create_room", { userName });
  }

  joinRoom(roomId: string, userName: string) {
    this.socket?.emit("join_room", { roomId, userName });
  }

  selectGame(roomId: string, gameType: string) {
    this.socket?.emit("select_game", { roomId, gameType });
  }

  startGame(roomId: string, initialGameState: any) {
    this.socket?.emit("start_game", { roomId, initialGameState });
  }

  // Game actions
  sendGameAction(roomId: string, action: string, payload: any) {
    this.socket?.emit("game_action", { roomId, action, payload });
  }

  reserveSlot(roomId: string, slotId: string) {
    this.socket?.emit("reserve_slot", { roomId, slotId });
  }
}

export const socketService = new SocketService();
