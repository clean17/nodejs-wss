const socket = io();

const welcome = document.getElementById('welcome');
const form = document.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;
let roomName;

// function backendDone(msg){
//     console.log(msg);
// }

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector('h3');
    h3.innerText = `Room - ${roomName}`;
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector('input');
    socket.emit('enter_room', /* { payload: input.value } */ input.value, showRoom);  // 1. 이벤트 2. 오브젝트 3. 콜백, string으로 변환하지 않아도 됨       
    roomName = input.value;
    input.value = "";
}

form.addEventListener('submit', handleRoomSubmit);