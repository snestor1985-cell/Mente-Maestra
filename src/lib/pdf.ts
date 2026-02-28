import jsPDF from 'jspdf';
import { generateSudoku, Difficulty } from './sudoku';

export const generatePDF = (
  type: 'Sudoku' | 'Crossword',
  count: number,
  difficulty: Difficulty,
  withSolutions: boolean
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Title
  doc.setFontSize(24);
  doc.text('MENTE MAESTRA', pageWidth / 2, margin, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${type} - ${difficulty}`, pageWidth / 2, margin + 10, { align: 'center' });
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  let yPos = margin + 30;
  const puzzles = [];

  for (let i = 0; i < count; i++) {
    if (type === 'Sudoku') {
      const puzzle = generateSudoku(difficulty);
      puzzles.push(puzzle);

      // Draw Grid
      const gridSize = 100;
      const cellSize = gridSize / 9;
      const xStart = (pageWidth - gridSize) / 2;
      
      // Check if we need a new page
      if (yPos + gridSize > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 30;
      }

      doc.setFontSize(10);
      doc.text(`Puzzle #${i + 1}`, xStart, yPos - 5);

      // Draw cells
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const x = xStart + c * cellSize;
          const y = yPos + r * cellSize;
          
          // Draw cell border
          doc.setLineWidth(0.1);
          doc.rect(x, y, cellSize, cellSize);

          // Draw number
          if (puzzle.grid[r][c] !== 0) {
            doc.setFontSize(12);
            doc.text(puzzle.grid[r][c].toString(), x + cellSize / 2, y + cellSize / 1.5, { align: 'center' });
          }
        }
      }

      // Draw thick borders for 3x3 boxes
      doc.setLineWidth(0.5);
      for (let i = 0; i <= 3; i++) {
        doc.line(xStart + i * (cellSize * 3), yPos, xStart + i * (cellSize * 3), yPos + gridSize);
        doc.line(xStart, yPos + i * (cellSize * 3), xStart + gridSize, yPos + i * (cellSize * 3));
      }

      yPos += gridSize + 20;
    }
  }

  // Solutions Page
  if (withSolutions) {
    doc.addPage();
    doc.setFontSize(18);
    doc.text('Soluciones', pageWidth / 2, margin, { align: 'center' });
    
    let solY = margin + 20;
    let solX = margin;
    const solSize = 40; // Smaller grid for solutions
    const solCellSize = solSize / 9;

    puzzles.forEach((puzzle, index) => {
      // Check page break
      if (solY + solSize > pageHeight - margin) {
        doc.addPage();
        solY = margin + 20;
        solX = margin;
      }

      doc.setFontSize(8);
      doc.text(`Solución #${index + 1}`, solX, solY - 2);

      // Draw solution grid
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const x = solX + c * solCellSize;
          const y = solY + r * solCellSize;
          
          doc.setLineWidth(0.05);
          doc.rect(x, y, solCellSize, solCellSize);
          
          doc.setFontSize(6);
          doc.text(puzzle.solution[r][c].toString(), x + solCellSize / 2, y + solCellSize / 1.3, { align: 'center' });
        }
      }
      
      // Thick borders
      doc.setLineWidth(0.2);
      for (let i = 0; i <= 3; i++) {
        doc.line(solX + i * (solCellSize * 3), solY, solX + i * (solCellSize * 3), solY + solSize);
        doc.line(solX, solY + i * (solCellSize * 3), solX + solSize, solY + i * (solCellSize * 3));
      }

      // Move to next position (2 columns layout)
      if (solX === margin) {
        solX = pageWidth / 2 + 10;
      } else {
        solX = margin;
        solY += solSize + 15;
      }
    });
  }

  doc.save(`MenteMaestra_${type}_${difficulty}.pdf`);
};
