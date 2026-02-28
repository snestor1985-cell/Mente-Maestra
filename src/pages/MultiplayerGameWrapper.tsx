import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import FitWordsGame from './FitWordsGame';
import CrosswordGame from './CrosswordGame';

export default function MultiplayerGameWrapper() {
  const location = useLocation();
  const state = location.state as { 
    gameType: string; 
    gameData: any; 
    isMultiplayer: boolean; 
    roomId: string; 
  } | null;

  const { startFitWords, startCrossword } = useGameStore();

  useEffect(() => {
    if (state) {
      if (state.gameType === 'fitwords') {
        startFitWords(state.gameData);
      } else if (state.gameType === 'crossword') {
        startCrossword(state.gameData);
      }
    }
  }, [state]);

  if (!state) {
    return <Navigate to="/multiplayer" />;
  }

  if (state.gameType === 'fitwords') {
    return <FitWordsGame isMultiplayer={true} roomId={state.roomId} />;
  }
  
  if (state.gameType === 'crossword') {
    return <CrosswordGame isMultiplayer={true} roomId={state.roomId} />;
  }
  
  // Fallback
  return <div>Game type not supported yet</div>;
}
