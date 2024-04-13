import express, { Express, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
const { createServer } = require("http");
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import createRoom from "./modules/createRoom";
import joinRoom from "./modules/joinRoom";
import disconnect from "./modules/disconnect";
import updateChessBoardState from "./modules/updateChessBoardState";
import { Room } from "./interfaces/room";
import connectToMongo from "./config/db"

dotenv.config();

// Server Init and Config
const app: Express = express();
connectToMongo();
const server: any = createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Typescript + Node.js + Express Server");
});

app.use('/api/auth', require('./routes/auth'))
app.use('/api/admin', require('./routes/admin'))

// Maintain a list of active rooms and users in each room
const activeRooms: Map<string, Room> = new Map();
// Maps each socket id created for user to their username
const socketIDToUserNameMapper: Map<string,string> = new Map();
io.on("connection", (socket) => {
  console.log(`User:${socket.id} Connected`);
  socket.on("create room", (roomName: string, userName: string) => createRoom(io, socket, roomName, userName, activeRooms, socketIDToUserNameMapper));
  socket.on("join room", (roomName: string, userName: string) => joinRoom(io, socket, roomName, userName, activeRooms, socketIDToUserNameMapper));
  socket.on("updateChessboardState", (roomName: string, updatedChessBoardMatrix: Array<Array<string>>) => updateChessBoardState(io, socket, roomName, updatedChessBoardMatrix, socketIDToUserNameMapper));
  socket.on("disconnect", () => disconnect(io, socket, activeRooms, socketIDToUserNameMapper));
});

server.listen(port, () => {
  console.log(`Server is Running on Port:${port}`);
});
