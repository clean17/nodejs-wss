const socket = io();

const welcome = document.querySelector('welcome');
const form = document.querySelector('form');

function backendDone(msg){
    console.log(msg);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector('input');
    socket.emit('enter_room', { payload: input.value }, backendDone);  // 1. 이벤트 2. 오브젝트 3. 콜백, string으로 변환하지 않아도 됨       
    input.value = "";
}

form.addEventListener('submit', handleRoomSubmit);