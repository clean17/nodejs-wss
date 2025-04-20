import express from "express";
import http from "http";
import { Server } from "socket.io";

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.locals.title = 'My App';

// app.set("view engine", "pug");
// app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로
// app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공

app.use("/public", express.static(join(__dirname, "public")));
app.use("/", express.static(join(__dirname, "views"))); // views 폴더를 정적 파일 폴더로 설정

// app.get('/', function (req, res) {
//     res.render('home_video');
// });

// 🔽 메인 HTML 파일 라우팅
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "views", "home_video.html"));
});

app.get('/*', (_, res) => { res.redirect("/") });

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit('welcome');
    }); 
    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer);
    });
    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer);
    });
    socket.on('ice', (ice, roomName) => {
        socket.to(roomName).emit('ice', ice);
    });
    socket.on("leave_room", (roomName) => {
        socket.to(roomName).emit("peer_left");
    });
});

const handleListen = () => console.log(app.locals.title + ' is listening on port 3001');
server.listen(3001, handleListen);
