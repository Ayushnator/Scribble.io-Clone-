export interface Player {
  id: string;
  username: string;
  score: number;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export interface DrawData {
  x: number;
  y: number;
  isDrawing: boolean;
  color: string;
  lineWidth: number;
}
