import express from "express";
import http from "http";
import nodemon from "nodemon";
import SocketIO from "socket.io";
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공

app.get('/', function (req, res) {
    res.render('home_io'); // pug-ws
});

app.get('/*', (_, res) => { res.redirect("/") });

const server = http.createServer(app);
const io = SocketIO(server);

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

function roomCount(roomName){
    return io.sockets.adapter.rooms.get(roomName)?.size; // rooms 는 map, 내부는 set
}

io.on('connection', (socket) => {
    console.log(io.sockets.adapter);
    const randomUUID = uuidv4();
    const shortenedUuid = randomUUID.replace(/-/g, '').substring(0, 12); // '-'문자 제거 후 
    socket['nickname'] = `User-${shortenedUuid}`;
    socket.onAny((event, ...args) => {
        console.log(`got ${event}`);
    });
    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName);
        done(); // showRoom
        socket.to(roomName).emit("welcome", socket.nickname, roomCount(roomName)); // welcome 이벤트 발생
        io.sockets.emit('room_change', publicRooms());
    }); // 커스텀 이벤트
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => { // set 이므로 forEach 가능
            socket.to(room).emit('bye', socket.nickname, roomCount(room) - 1)
        });
    });
    socket.on("disconnect", () => {
        io.sockets.emit('room_change', publicRooms());
    }); 
    socket.on("new_msg", (msg, room, done) => {
        socket.to(room).emit("new_msg", `${socket.nickname} : ${msg}`);
        done();
    });
    socket.on('nickname', (nickname) => {
        socket['nickname'] = nickname; // socket의 nickname 프로퍼티 설정
    })
});


const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');
server.listen(3000, handleListen);
