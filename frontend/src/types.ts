export interface Avatar {
  id: number;
  emoji: string;
  color: string;
}

export interface Player {
  id: string;
  username: string;
  score: number;
  isDrawing: boolean;
  hasGuessed: boolean;
  avatar: Avatar;
}

export interface DrawData {
  x: number;
  y: number;
  isDrawing: boolean;
  color: string;
  lineWidth: number;
}
