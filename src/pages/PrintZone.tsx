import { useState } from 'react';
import { generatePDF as generateSudokuPDF } from '../lib/pdf';
import { Difficulty, generateSudoku } from '../lib/sudoku';
import { generateCrossword } from '../lib/crossword';
import { Printer, Check, Download, FileText, LayoutGrid, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import jsPDF from 'jspdf';

export default function PrintZone() {
  const [activeTab, setActiveTab] = useState<'sudoku' | 'crossword'>('sudoku');
  
  // Sudoku State
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [count, setCount] = useState(1);
  const [withSolutions, setWithSolutions] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintSudoku = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateSudokuPDF('Sudoku', count, difficulty, withSolutions);
      setIsGenerating(false);
    }, 100);
  };

  const handlePrintCrossword = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const cw = generateCrossword();
      
      // Title
      doc.setFontSize(22);
      doc.text("Crucigrama", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text("Mente Maestra", 105, 30, { align: 'center' });

      // Draw Grid
      const cellSize = 10;
      const startX = (210 - (cw.width * cellSize)) / 2;
      const startY = 40;

      doc.setLineWidth(0.2);
      doc.setFontSize(8);

      for (let r = 0; r < cw.height; r++) {
        for (let c = 0; c < cw.width; c++) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          const cell = cw.grid[r][c];

          if (cell.isBlack) {
            doc.setFillColor(0, 0, 0);
            doc.rect(x, y, cellSize, cellSize, 'F');
          } else {
            doc.rect(x, y, cellSize, cellSize);
            if (cell.number) {
              doc.text(cell.number.toString(), x + 1, y + 3);
            }
          }
        }
      }

      // Clues
      let yPos = startY + (cw.height * cellSize) + 10;
      doc.setFontSize(12);
      doc.text("Pistas:", 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      const colWidth = 80;
      let leftY = yPos;
      let rightY = yPos;

      // Across
      doc.setFont("helvetica", "bold");
      doc.text("Horizontales", 20, leftY);
      leftY += 5;
      doc.setFont("helvetica", "normal");
      
      cw.clues.filter(c => c.direction === 'across').forEach(clue => {
        const text = `${clue.number}. ${clue.text}`;
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, 20, leftY);
        leftY += (lines.length * 4) + 1;
      });

      // Down
      doc.setFont("helvetica", "bold");
      doc.text("Verticales", 110, rightY);
      rightY += 5;
      doc.setFont("helvetica", "normal");

      cw.clues.filter(c => c.direction === 'down').forEach(clue => {
        const text = `${clue.number}. ${clue.text}`;
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, 110, rightY);
        rightY += (lines.length * 4) + 1;
      });

      doc.save(`crucigrama-mentemaestra.pdf`);
      setIsGenerating(false);
    }, 100);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-6 h-6 text-indigo-500" />
            Zona de Impresión
          </h1>
          <p className="text-slate-500 text-sm">Genera PDFs para jugar offline</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('sudoku')}
          className={clsx(
            "flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
            activeTab === 'sudoku' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText className="w-4 h-4" />
          Sudoku
        </button>
        <button
          onClick={() => setActiveTab('crossword')}
          className={clsx(
            "flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
            activeTab === 'crossword' ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Crucigrama
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {activeTab === 'sudoku' ? (
          <>
            <div className="p-6 space-y-8">
              {/* Difficulty Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Dificultad</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Easy', 'Medium', 'Hard', 'Expert'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={clsx(
                        "py-2 px-4 rounded-lg text-sm font-medium border transition-colors",
                        difficulty === diff 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Cantidad de Puzzles</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={count} 
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-xl font-bold text-slate-900 w-12 text-center">{count}</span>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className={clsx(
                    "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                    withSolutions ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                  )}>
                    {withSolutions && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={withSolutions} 
                    onChange={() => setWithSolutions(!withSolutions)} 
                  />
                  <div>
                    <span className="font-medium text-slate-900 block">Incluir Soluciones</span>
                    <span className="text-xs text-slate-500">Se añadirán al final del PDF</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-200">
              <button
                onClick={handlePrintSudoku}
                disabled={isGenerating}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>Generando PDF...</>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Descargar Sudoku PDF
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 space-y-6 text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-10 h-10 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Generador de Crucigramas</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                Crea un crucigrama único con palabras en español y sus definiciones. Listo para imprimir en formato A4.
              </p>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-200">
              <button
                onClick={handlePrintCrossword}
                disabled={isGenerating}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>Generando PDF...</>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Descargar Crucigrama PDF
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
