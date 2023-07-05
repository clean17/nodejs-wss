import express from "express";
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
    res.render('home');
});

app.get('/index', function (req, res) {
    res.send('Backend Server');
});

app.route('/book')
    .get(function (req, res) {
        res.send('Get a book');
    })
    .post(function (req, res) {
        res.send('Add a book');
    })
    .put(function (req, res) {
        res.send('Update a book');
    });

const handleListen = () => console.log(`Listening on http://localhost:3000`);
const server = app.listen(3000, function () {
    console.log(app.locals.title + ' is listening on port 3000');
});