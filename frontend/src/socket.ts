import { io } from 'socket.io-client';

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(backendURL);

export default socket;
