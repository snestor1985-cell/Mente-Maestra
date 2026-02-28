import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateFitWords } from '../lib/fitwords';
import { generateCrossword } from '../lib/crossword';

export default function MultiplayerLobby() {
  const { userName, setUserName } = useGameStore();
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for room ID in URL
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }

    const socket = socketService.connect();

    socket.on("room_created", (data) => {
      setRoomId(data.roomId);
    });

    socket.on("room_update", (room) => {
      console.log("Room update:", room);
      setCurrentRoom(room);
      setIsLoading(false);
    });

    socket.on("game_started", (data) => {
      const { roomId, gameType, gameData } = data;
      // Navigate to game with state
      navigate(`/multiplayer/game/${roomId}`, { 
        state: { 
          gameType, 
          gameData, 
          isMultiplayer: true,
          roomId: roomId 
        } 
      });
    });

    socket.on("error", (data) => {
      setError(data.message);
    });

    return () => {
      socket.off("room_created");
      socket.off("room_update");
      socket.off("error");
      socket.off("game_started");
    };
  }, []);

  const handleCreateRoom = () => {
    if (!userName) return alert("Ingresa tu nombre primero");
    setIsLoading(true);
    socketService.createRoom(userName);
  };

  const handleJoinRoom = () => {
    if (!userName) return alert("Ingresa tu nombre primero");
    if (!roomId) return alert("Ingresa el código de la sala");
    setIsLoading(true);
    socketService.joinRoom(roomId, userName);
  };

  const handleStartGame = () => {
    if (!currentRoom || !currentRoom.gameType) return;
    
    let gameData = {};
    if (currentRoom.gameType === 'fitwords') {
      gameData = generateFitWords();
    } else if (currentRoom.gameType === 'crossword') {
      gameData = generateCrossword();
    }

    socketService.startGame(currentRoom.id, gameData);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoom.id);
    alert("Código copiado!");
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/multiplayer?room=${currentRoom.id}`;
    navigator.clipboard.writeText(link);
    alert("Enlace copiado!");
  };

  if (currentRoom) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Sala de Espera</h2>
          
          <div className="bg-indigo-50 p-4 rounded-xl mb-4 flex items-center justify-between border border-indigo-100">
            <div>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Código de Sala</p>
              <p className="text-3xl font-mono font-bold text-indigo-900">{currentRoom.id}</p>
            </div>
            <button onClick={copyRoomId} className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100" title="Copiar código">
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={copyShareLink}
            className="w-full mb-6 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar Enlace de Invitación
          </button>

          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <span className="font-bold bg-blue-200 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Comparte el código con tu amigo
            </p>
            <p className="flex items-center gap-2">
              <span className="font-bold bg-blue-200 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Espera a que se una a la sala
            </p>
            <p className="flex items-center gap-2">
              <span className="font-bold bg-blue-200 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
              Selecciona un juego y comienza
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Jugadores ({currentRoom.players.length})
            </h3>
            <div className="space-y-2">
              {currentRoom.players.map((p: any) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-900">{p.name} {p.id === socketService.socket?.id && "(Tú)"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 mb-2">Elegir Juego</h3>
            <button 
              onClick={() => socketService.selectGame(currentRoom.id, 'fitwords')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${currentRoom.gameType === 'fitwords' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
            >
              <span className="font-bold block text-slate-900">Palabras Encajadas</span>
              <span className="text-sm text-slate-500">Modo Competitivo (Versus)</span>
            </button>
            
            <button 
              onClick={() => socketService.selectGame(currentRoom.id, 'crossword')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${currentRoom.gameType === 'crossword' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
            >
              <span className="font-bold block text-slate-900">Crucigrama</span>
              <span className="text-sm text-slate-500">Modo Competitivo (Versus)</span>
            </button>
          </div>

          {currentRoom.gameType && (
            <div>
              {currentRoom.players.length < 2 ? (
                <div className="mt-6 w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 cursor-not-allowed">
                  <Users className="w-6 h-6" />
                  Esperando jugadores...
                </div>
              ) : (
                <button 
                  onClick={handleStartGame}
                  className="mt-6 w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6" />
                  Comenzar Juego
                </button>
              )}
              {currentRoom.players.length < 2 && (
                <p className="text-center text-sm text-slate-400 mt-2">
                  Se necesitan al menos 2 jugadores para comenzar
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Multijugador</h1>
        <p className="text-slate-500 text-center mb-8">Juega con amigos en tiempo real</p>

        {!userName ? (
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Tu Nombre</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej. Jugador 1"
              onBlur={(e) => setUserName(e.target.value)}
            />
          </div>
        ) : (
          <div className="mb-8 text-center">
            <p className="text-slate-600 mb-2">Hola, <span className="font-bold text-indigo-600">{userName}</span></p>
            <button 
              onClick={() => setUserName("")}
              className="text-xs text-slate-400 hover:text-indigo-500 underline"
            >
              Cambiar nombre (para probar con otra pestaña)
            </button>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? "Conectando..." : "Crear Sala"}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">O unirse a una existente</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              className="flex-1 p-3 border border-slate-200 rounded-xl font-mono text-center uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button 
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold"
            >
              Unirse
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
