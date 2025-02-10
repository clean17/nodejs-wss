const socket = io();

const welcome = document.getElementById('welcome');
const form = document.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;
let roomName;

// 채팅 보내기 ( 로그 남기기 )
function addMessage(msg) {
    const ul = room.querySelector('ul');
    const li = document.createElement('li');
    li.style.listStyleType = "none";
    li.innerText = msg;
    ul.appendChild(li);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector('#msg input'); // querySelector 는 첫번째 요소만 가져오므로 id 태그 이용
    const value = input.value;
    // join한 room에만 메세지 전송
    socket.emit('new_msg', input.value, roomName, () => {
        addMessage(`You : ${value}`); // 내가 작성한 메세지 렌더링
    });
    input.value = "";
}

function handleNickNameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector('#name input');
    socket.emit('nickname', input.value);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector('h3');
    h3.innerText = `Room - ${roomName} `;
    const msgForm = room.querySelector('#msg');
    const nameForm = room.querySelector('#name');
    // 이벤트 리스너 추가
    msgForm.addEventListener('submit', handleMessageSubmit);
    nameForm.addEventListener('submit', handleNickNameSubmit);
    const nicknameInput = nameForm.elements['nickname'];
    nicknameInput.value = "";
}

function showCount(count) {
    const h3 = room.querySelector('h3');
    h3.innerText = `Room - ${roomName} (${count})`;
}

// join room
function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector('input');
    socket.emit('enter_room', /* { payload: input.value } */ input.value, showRoom);  // 1. 이벤트 2. 오브젝트 3. 콜백, string으로 변환하지 않아도 됨       
    roomName = input.value;
    input.value = "";
}

// 이벤트 리스너
form.addEventListener('submit', handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    addMessage(`${user} Joined!`);
    showCount(newCount)
});

socket.on("bye", (user, newCount) => {
    addMessage(`${user} left !`);
    showCount(newCount)
});

socket.on("new_msg", (msg) => {
    addMessage(msg);
});

// room이 생성되거나 제거되면 다른 소켓이 갱신
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector('ul');
    roomList.innerHTML = ""; // 매번 새롭게 렌더링
    if( rooms.length === 0 ){
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.style.listStyleType = "none";
        li.innerText = room;
        roomList.append(li);
    });
});