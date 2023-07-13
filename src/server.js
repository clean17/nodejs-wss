import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공

app.get('/', function (req, res) {
    res.render('home_video');
});

app.get('/*', (_, res) => { res.redirect("/") });

const server = http.createServer(app);
const io = new Server(server);

const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');
server.listen(3000, handleListen);
