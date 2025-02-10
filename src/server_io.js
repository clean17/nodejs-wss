import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
const { instrument } = require("@socket.io/admin-ui");
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로

// CORS 설정 추가 (Express용)
app.use(cors({
    origin: "http://localhost:8090",  // Python 서버에서 접근 허용
    methods: ["GET", "POST"],
    credentials: true
}));
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공
app.use(express.json()); // JSON 요청을 받을 수 있도록 설정


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://admin.socket.io", "http://localhost:8090"],
        credentials: true,
        methods: ["GET", "POST"]
    },
});

instrument(io, {
    auth: false,
    mode: "development",
});

app.get('/', function (req, res) {
    res.render('home_io'); // pug-ws
});

app.get('/*', (_, res) => { res.redirect("/") });

app.post("/broadcast", (req, res) => {
    const { message, room } = req.body;

    console.log(`Received from Python: ${message}`);
    io.to(room).emit("new_msg", message);  // 해당 room에 있는 모든 클라이언트에게 전송
    res.json({ status: "broadcasted" });
});

function publicRooms() {
    /* const sids = io.sockets.adapter.sids;
    const rooms = io.sockets.adapter.rooms; */ // 아래가 더 깔끔
    const { sockets: { adapter: { sids, rooms } } } = io;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

function roomCount(roomName) {
    return io.sockets.adapter.rooms.get(roomName)?.size; // rooms 는 map, 내부는 set
}

io.on('connection', (socket) => {
    // console.log(io.sockets.adapter);
    const randomUUID = uuidv4();
    const shortenedUuid = randomUUID.replace(/-/g, '').substring(0, 12); // '-'문자 제거 후
    socket['nickname'] = `User-${shortenedUuid}`;
    /*socket.onAny((event, ...args) => {
        console.log(`got ${event}`);
    });*/

    // Python에서 받은 로그인된 유저 정보 저장
    let username = "Guest";

    socket.on("user_info", (data) => {
        username = data.username || "Guest";
        console.log(`User logged in: ${username}`);
    });

    socket.on("new_msg", (data) => {
        console.log(`Message from ${data.username}: ${data.msg}`);
        io.emit("new_msg", { username: data.username, msg: data.msg });
    });

    socket.on("disconnect", () => {
        console.log(`${username} disconnected`);
    });

    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName);
        done(); // showRoom
        socket.to(roomName).emit("welcome", socket.nickname, roomCount(roomName)); // welcome 이벤트 발생
        io.sockets.emit('room_change', publicRooms());
    });
    // disconnecting; 연결이 끊기기 직전에 발생하는 이벤트
    /*socket.on("disconnecting", () => {
        socket.rooms.forEach(room => { // set 이므로 forEach 가능
            socket.to(room).emit('bye', socket.nickname, roomCount(room) - 1)
        });
    });
    // disconnect; 연결이 완전히 끊긴 후에 발생하는 이벤트
    socket.on("disconnect", () => {
        io.sockets.emit('room_change', publicRooms());
    });
    // 메시지 수신
    socket.on("new_msg", (msg, room, done) => {
        socket.to(room).emit("new_msg", `${socket.nickname} : ${msg}`);
        done();
    });*/
    // 닉네임 변경
    socket.on('nickname', (nickname) => {
        socket['nickname'] = nickname; // socket의 nickname 프로퍼티 설정
    })
    // 다른 서버와 통신 테스트
    socket.on("sendData", async (data) => {
        console.log("Received JSON:", data);

        // Python 서버로 JSON 데이터 전달
        try {
            await axios.post("http://127.0.0.1:8090/func/socket", data, {
                headers: { "Content-Type": "application/json" }
            });
            console.log("Data sent to Python server");
        } catch (error) {
            console.error("Error sending data to Python server:", error);
        }
    });
});


const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');
server.listen(3000, handleListen);
