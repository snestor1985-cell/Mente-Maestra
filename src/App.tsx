import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SudokuGame from './pages/SudokuGame';
import PrintZone from './pages/PrintZone';
import DailyChallenge from './pages/DailyChallenge';
import Achievements from './pages/Achievements';
import RushChallenge from './pages/RushChallenge';

import CrosswordGame from './pages/CrosswordGame';
import FitWordsGame from './pages/FitWordsGame';
import MultiplayerLobby from './pages/MultiplayerLobby';
import MultiplayerGameWrapper from './pages/MultiplayerGameWrapper';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sudoku" element={<SudokuGame />} />
          <Route path="crossword" element={<CrosswordGame />} />
          <Route path="fitwords" element={<FitWordsGame />} />
          <Route path="multiplayer" element={<MultiplayerLobby />} />
          <Route path="multiplayer/game/:roomId" element={<MultiplayerGameWrapper />} />
          <Route path="print" element={<PrintZone />} />
          <Route path="daily" element={<DailyChallenge />} />
          <Route path="rush" element={<RushChallenge />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="*" element={<div className="p-8 text-center">Página no encontrada</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
