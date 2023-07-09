import express from "express";
import http from "http";
import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';

/* 자바스크립트에서 서버 실행
var express = require('express');
var app = express();
 */

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공

app.get('/', function (req, res) {
    // res.send('Welcome to ' + app.locals.title);
    res.render('home'); // pug-ws
});

app.get('/*', (_, res) => { res.redirect("/") });

// app.route('/book')
//     .get(function (req, res) {
//         res.send('Get a book');
//     })
//     .post(function (req, res) {
//         res.send('Add a book');
//     })
//     .put(function (req, res) {
//         res.send('Update a book');
//     });

// ws를 추가한 http 서버를 직접 생성하기 위해서 express의 listen 제거
// app.listen(3000, function () {
//     console.log(app.locals.title + ' is listening on port 3000');
// }); 

const server = http.createServer(app);

// ws 라이브러리를 이용한 채팅 기능
const wss = new WebSocket.Server({ server });
// const sockets = []; // push로 데이터를 넣는다.
const sockets = new Map();

wss.on('connection', (socket) => {
    const randomUUID = uuidv4();
    const shortenedUuid = randomUUID.replace(/-/g, '').substring(0, 12); // '-'문자 제거 후 
    socket.nickname = `User-${shortenedUuid}`;
    console.log(`${socket.nickname} is connected.`);
    // sockets.push(socket);
    sockets.set(socket, 0);
    const keys = Array.from(sockets.keys());
    keys.forEach((sc) => {
        sc.send(`${socket.nickname} 님이 참가하셨습니다.`); 
    });
    // for (const sc of sockets) {
    //     sc.send(`${socket.nickname} 님이 참가하셨습니다.`);
    // }
    socket.on('message', (json) => {
        const msg = JSON.parse(json); // JS 오브젝트로 변환
        console.log(msg);
        const keys = [...sockets.keys()];
        switch (msg.type) {
            case "nickname":
                keys.forEach((sc) => {
                    sc.send(`<닉네임 변경> \n ${socket.nickname} -> ${msg.payload}`);
                });
                // for (const sc of sockets) {
                //     sc.send(`<닉네임 변경> \n ${socket.nickname} -> ${msg.payload}`);
                // }
                socket.nickname = msg.payload;
                break;
            case "message":
                console.log(`${socket.nickname}: ${msg.payload}`);
                keys.forEach((sc) => {
                    sc.send(`${socket.nickname} : ${msg.payload}`);
                });
            // for (const sc of sockets) {
            //     sc.send(`${socket.nickname} : ${msg.payload}`);
            // }
        }
    });
    socket.on('close', () => {
        console.log(`${socket.nickname} is disconnected.`);
        sockets.delete(socket); // O(1)
        const keys = [...sockets.keys()];
        keys.forEach((sc) => {
            sc.send(`${socket.nickname} 님이 나갔습니다.`);
        });
        // for (const sc of sockets) {
        //     sc.send(`${socket.nickname} 님이 나갔습니다.`);
        // }
    });
}); 

const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');
server.listen(3000, handleListen);
