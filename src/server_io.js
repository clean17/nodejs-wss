import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import path, {join} from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";
import https from "https";
import http from "http";
import cors from "cors";
//import { instrument } from "@socket.io/admin-ui";
//import webpush from "web-push";
//import admin from "firebase-admin";

import dotenv from 'dotenv';    // .env 파일에 정의된 내용을 읽어서 process.env에 주입해주는 역할
dotenv.config();                // .env 파일을 읽고 그 안의 내용을 process.env 객체에 로딩
// process.env의 프로퍼티로 접근 > .env 에 PORT=32 가 있으면 process.env.PORT

/**************************************************************************/
/*// Firebase 서비스 계정 키 로드
const serviceAccount = JSON.parse(fs.readFileSync("path/to/serviceAccountKey.json", "utf-8"));

// Firebase Admin 초기화
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 클라이언트에서 저장한 FCM 토큰 저장
let userTokens = {};  // { userId: token }

app.post("/save-fcm-token", (req, res) => {
    const { userId, token } = req.body;
    userTokens[userId] = token; // DB에 저장하면 더 안전함
    res.json({ success: true, message: "FCM 토큰 저장 완료" });
});

// 소켓으로 채팅 메시지를 받으면 FCM 알림 전송
app.post("/send-message", async (req, res) => {
    const { userId, message } = req.body;
    const token = userTokens[userId];

    if (!token) {
        return res.status(400).json({ success: false, message: "FCM 토큰이 없음" });
    }

    const payload = {
        notification: {
            title: "새로운 채팅 메시지",
            body: message
        },
        token: token
    };

    try {
        const response = await admin.messaging().send(payload);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});*/

// VAPID 키 설정 (https://web-push-codelab.glitch.me/ 에서 생성 가능)
/*const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
    "mailto:piw940317@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);*/

// 구독 정보를 받아서 푸시 전송
// const pushSubscription = { /* 클라이언트에서 받은 구독 객체 */ };
// const payload = JSON.stringify({ title: "법무부", body: "새로운 알림이 있습니다." });

// webpush.sendNotification(pushSubscription, payload).catch(err => console.error(err));
/**************************************************************************/


const __filename = fileURLToPath(import.meta.url); // import.meta.url; 현재 실행 중인 모듈의 URL을 가져옴, 현재 파일 경로를 반환
const __dirname = path.dirname(__filename); // 파일이 있는 디렉토리 경로

const app = express();
const key = fs.readFileSync("C:/nginx/nginx-1.26.2/ssl/chickchick.shop-key.pem");
const cert= fs.readFileSync("C:/nginx/nginx-1.26.2/ssl/fullchain.pem");
const ca= fs.readFileSync("C:/nginx/nginx-1.26.2/ssl/chain.pem");
const options = {
    key: key,
    cert: cert
};

// CORS 설정 추가 (Express용)
/*app.use(cors({
    origin: "http://localhost:8090",  // Python 서버에서 접근 허용
    methods: ["GET", "POST"],
    credentials: true
}));*/

app.locals.title = 'Node.js Server';
app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로

app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공
app.use("/", express.static(join(__dirname, "views"))); // views 폴더를 정적 파일 폴더로 설정
app.use(express.json()); // JSON 요청을 받을 수 있도록 설정

app.get("/", (req, res) => {
    // res.render('home_io'); // pug-ws
    res.sendFile(join(__dirname, "views", "home_video.html"));
});
app.get('/*', (_, res) => { res.redirect("/") });



// const server = http.createServer(app);
const server = https.createServer(options, app);
const io = new Server(server, {
    cors: {
        // origin: ["https://admin.socket.io", "http://localhost:8090"],
        origin: "*",                   //    CORS 설정: 모든 도메인 허용
        credentials: true,             //    인증정보(Cookie 등) 포함 가능
        methods: ["GET", "POST"]       //    허용할 메서드 지정
    },
});

/*instrument(io, {
    auth: false,
    mode: "development",
});*/


/*app.post("/broadcast", (req, res) => {
    const { message, room } = req.body;

    console.log(`Received from Python: ${message}`);
    io.to(room).emit("new_msg", message);  // 해당 room에 있는 모든 클라이언트에게 전송
    res.json({ status: "broadcasted" });
});*/

function normalize_ip(ip_address) {
    if (ip_address.startsWith("::ffff:")) {
        return ip_address.substring(7,)
    }
    return ip_address
}

const agent = new https.Agent({
    // rejectUnauthorized: false, // 인증서 검증 비활성화
    ca: ca // 인증서를 서버가 신뢰하도록 한다
});

function sendServerChatMessage(username, message, roomname, socket) {
    const now = new Date();
    now.setHours(now.getHours() + 9);  // UTC → KST 변환
    const timestamp = now.toISOString().slice(2, 19).replace(/[-T:]/g, "");
    const clientIp = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;

    return axios.post("https://chickchick.shop/func/api/chat/save-file", {
    // axios.post("http://127.0.0.1:8090/func/api/chat/save-file", {
    // axios.post("https://merci-seoul.iptime.org/func/chat/save-file", {
        timestamp: timestamp,
        username: username,
        message: message,
        roomname: roomname,
    }, {
        headers: {
            "X-Forwarded-For": normalize_ip(clientIp),
            "X-Client-IP": normalize_ip(clientIp)
        },
        // httpsAgent: agent // 공인 인증서를 사용중이면 필요없다
    }).then((res)=> {
        const data = res.data;
        return data['inserted_id'];
    }).catch(err => console.error("로그 전송 실패:", err));
}

function publicRooms() {
    /* const sids = io.sockets.adapter.sids;
    const rooms = io.sockets.adapter.rooms; */ // 아래가 더 깔끔

    const { sockets: { adapter: { sids, rooms } } } = io;
    const publicRooms = [];
    rooms.forEach((_, key) => { // rooms, sids 동일한 Map 이다
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    })
    // publicRooms 에는 생성된 room 리스트가 있다
    return publicRooms;
}

function roomCount(roomName) {
    return io.sockets.adapter.rooms.get(roomName)?.size; // rooms 는 map, 내부는 set
}

async function sendRoomUserList(roomName) {
    const sockets = await io.in(roomName).allSockets();  // Set of socket IDs
    const usernames = new Set();

    sockets.forEach((id) => {
        const s = io.sockets.sockets.get(id);
        if (s && s.username) {
            usernames.add(s.username);
        }
    });

    // room 내의 모든 클라이언트에게 사용자 목록 전송
    io.to(roomName).emit('room_user_list', Array.from(usernames));
}

///////////////////////// 소켓 ///////////////////////////////

const videoUserSockets = new Map(); // username → socket.id
let chatRoomName = undefined;

// io.emit(...)                 전체 클라이언트에게 전송
// socket.emit(...)             자기 자신에게 전송
// socket.broadcast.emit(...)   자기 제외, 전체에게 전송
// io.to("room").emit(...)      특정 방에 있는 모든 사람에게 전송
// socket.to("room").emit(...)  자기 제외 방 사람들에게 전송

// 소켓 서버는 하나
// 소켓에 연결되는 소켓 인스턴스는 여러개 > socket.id를 가지는 별개의 인스턴스
// room은 소켓 인스턴스를 묶는 그룹

// 특정 room의 socket 리스트 가져오기
// const socketsInRoom = await io.in('room-name').allSockets();
// console.log(socketsInRoom); // Set of socket IDs
io.on('connection', (socket) => {
    // console.log('새 소켓 연결:', socket.id);
    /*socket.onAny((event, ...args) => {
        console.log(`socket.onAny ${event}`);
    });*/
    // console.log(io.sockets.adapter);

    const randomUUID = uuidv4();
    const shortenedUuid = randomUUID.replace(/-/g, '').substring(0, 12); // '-'문자 제거 후
    socket['nickname'] = `User-${shortenedUuid}`;
    let username = "Guest";

    // 최초 입장 후 사용자 정보
    socket.on("user_info", (data) => {
        socket.username = data.username || "Guest";
        socket.nickname = data.username === 'nh824' ? '나현' : '인우';
        chatRoomName = data.room;
        username = data.username;
        socket.join(data.room);

        // sendRoomUserList(data.room);  // 입장 후 사용자 목록 전송
        // io.emit("enter_user", { username: socket.username, msg: socket.nickname + '님이 들어왔습니다.', underline: 1, room: data.room }); // 1:1 연결
        // socket.to(data.room).emit("enter_user", { username: socket.username, msg: socket.nickname + '님이 들어왔습니다.', underline: 1, room: data.room }); // room
    });

    // 브라우저 포커스 입장
    socket.on('enter_room', (data) => {
        socket.username = data.username || "Guest";
        socket.nickname = data.username === 'nh824' ? '나현' : '인우';
        chatRoomName = data.room;
        username = data.username;
        socket.join(data.room);

        sendRoomUserList(data.room);  // 입장 후 사용자 목록 전송

        socket.to(data.room).emit("enter_user", { username: socket.username, msg: socket.nickname + '님이 들어왔습니다.', underline: 1, room: data.room }); // room
        // io.sockets.emit('room_change', publicRooms()); // 뷰의 방 이름 보여주는 이벤트
    });

    socket.on('pending_chat_user', (data) => {
        sendRoomUserList(data.room);  // 입장 후 사용자 목록 전송
    })

    socket.on('exit_room', (data) => {
        socket.to(data.room).emit('bye', { username: socket.username, msg: (socket.nickname || socket.username) + '님이 나갔습니다.', underline: 1})
    })

    socket.on("new_msg", async (data) => {
        const chatId = await sendServerChatMessage(data.username, data.msg, data.room, socket);
        // io.emit("new_msg", { username: data.username, msg: data.msg, room: data.room }); 1:1 연결
        io.to(data.room).emit("new_msg", { chatId: chatId, username: data.username, msg: data.msg, room: data.room}); // room
    });

    socket.on("typing", (data) => {
        socket.to(data.room).emit("typing", { username: data.username });
    });

    socket.on("stop_typing", (data) => {
        socket.to(data.room).emit("stop_typing", { username: data.username });
    });

    socket.on("message_read", (data) => {
        socket.to(data.room).emit("message_read_ack", { chatId: data.chatId, room: data.room, username: data.username });
    });

    socket.on("disconnecting", () => { // disconnecting; 연결이 끊기기 직전에 발생하는 이벤트
        // console.log('소켓 연결 종료:', socket.id);

        socket.rooms.forEach(room => { // set 이므로 forEach 가능
            // socket.to(room).emit('bye', { username: socket.username, msg: (socket.nickname || socket.username) + '님이 나갔습니다.', underline: 1})

            if (room !== socket.id) {
                sendRoomUserList(room);
            }
        });
        // io.emit('bye', { username: socket.username, msg: (socket.nickname || socket.username) + '님이 나갔습니다.', underline: 1}); // 1:1, room 모두 가능
    });




    socket.on('check_video_call_by_user', (data) => {
        // videoUserSockets Map에 등록된 소켓의 첫번째 요소를 리턴
        const socketId = data.userList.find(user => videoUserSockets.get(user));
        io.emit('find_video_call', {userList: data.userList, socketId: socketId});
    });
    // video 연결 테스트
    socket.on('join_room', (roomName, username) => {
        socket.username = username;
        const oldSocketId = videoUserSockets.get(username);

        if (oldSocketId && oldSocketId !== socket.id) {
            // 동일 계정의 기존 연결이 있으면 강제 종료
            io.to(oldSocketId).emit("force_disconnect");
        }

        // 현재 소켓을 새로 등록
        videoUserSockets.set(username, socket.id);

        socket.join(roomName);
        socket.to(roomName).emit('welcome');

        socket.to(chatRoomName).emit('video_call_ready', { socketId: socket.id, videoCallRoomName: roomName, username: username });
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
    socket.on("leave_room", (roomName, username) => {
        socket.to(roomName).emit("peer_left");
        socket.to(chatRoomName).emit('video_call_ended', { socketId: socket.id, username: username });
    });

    // disconnect; 연결이 완전히 끊긴 후에 발생하는 이벤트
    socket.on("disconnect", () => {
        // io.sockets.emit('room_change', publicRooms());
        // 여기서 socket.rooms 를 찾아봤자 room에서 끊겨서 안나온다

        if (videoUserSockets.get(socket.username) === socket.id) {
            videoUserSockets.delete(socket.username);
            socket.to(chatRoomName).emit('video_call_ended', { socketId: socket.id, username: socket.username });
        }
    });
});




const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');
server.listen(3000, handleListen);