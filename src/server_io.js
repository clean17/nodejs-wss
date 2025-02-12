import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
// const { instrument } = require("@socket.io/admin-ui");
import { instrument } from "@socket.io/admin-ui";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import https from "https";

const __filename = fileURLToPath(import.meta.url); // import.meta.url; 현재 실행 중인 모듈의 URL을 가져옴, 현재 파일 경로를 반환
const __dirname = path.dirname(__filename); // 파일이 있는 디렉토리 경로

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로

// CORS 설정 추가 (Express용)
/*app.use(cors({
    origin: "http://localhost:8090",  // Python 서버에서 접근 허용
    methods: ["GET", "POST"],
    credentials: true
}));*/
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공
app.use(express.json()); // JSON 요청을 받을 수 있도록 설정


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // origin: ["https://admin.socket.io", "http://localhost:8090"],
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"]
    },
});

/*instrument(io, {
    auth: false,
    mode: "development",
});*/

app.get('/', function (req, res) {
    res.render('home_io'); // pug-ws
});

app.get('/*', (_, res) => { res.redirect("/") });

/*app.post("/broadcast", (req, res) => {
    const { message, room } = req.body;

    console.log(`Received from Python: ${message}`);
    io.to(room).emit("new_msg", message);  // 해당 room에 있는 모든 클라이언트에게 전송
    res.json({ status: "broadcasted" });
});*/


function sendServerChatMessage(username, message) {
    const now = new Date();
    now.setHours(now.getHours() + 9);  // UTC → KST 변환
    const timestamp = now.toISOString().slice(2, 19).replace(/[-T:]/g, "");
    // axios.post("http://localhost:8090/func/chat/save-file", {
    axios.post("https://merci-seoul.iptime.org/func/chat/save-file", {
        timestamp: timestamp,
        username: username,
        message: message
    },
        { httpsAgent: agent }
        ).catch(err => console.error("로그 전송 실패:", err));
}

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
        socket['nickname'] = username;
        // console.log(`User logged in: ${username}`);
        // io.emit("enter_user", { username: data.username, msg: username + '님이 들어왔습니다.' });
    });

    socket.on("new_msg", (data) => {
        // console.log(`Message from ${data.username}: ${data.msg}`);
        // logChatMessage(data.username, data.msg);
        sendServerChatMessage(data.username, data.msg);
        io.emit("new_msg", { username: data.username, msg: data.msg });
    });

    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName);
        done(); // showRoom
        socket.to(roomName).emit("welcome", socket.nickname, roomCount(roomName)); // welcome 이벤트 발생
        io.sockets.emit('room_change', publicRooms());
    });
    // disconnecting; 연결이 끊기기 직전에 발생하는 이벤트
    socket.on("disconnect", () => {
        // console.log(socket.nickname + '님이 나가셨습니다.')
        /*socket.rooms.forEach(room => { // set 이므로 forEach 가능
            socket.to(room).emit('bye', { username: socket.nickname, msg: socket.nickname + '님이 나갔습니다.' })
        });*/
        // io.emit('bye', { username: socket.nickname, msg: socket.nickname + '님이 나갔습니다.' }); // room 만들지 않고 임시
    });
    // disconnect; 연결이 완전히 끊긴 후에 발생하는 이벤트
    /*socket.on("disconnect", () => {
        io.sockets.emit('room_change', publicRooms());
    });
    // 메시지 수신
    socket.on("new_msg", (msg, room, done) => {
        socket.to(room).emit("new_msg", `${socket.nickname} : ${msg}`);
        done();
    });
    // 닉네임 변경
    socket.on('nickname', (nickname) => {
        socket['nickname'] = nickname; // socket의 nickname 프로퍼티 설정
    })*/
});


const handleListen = () => console.log(app.locals.title + ' is listening on port 3001');
server.listen(3001, handleListen);