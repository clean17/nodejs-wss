const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");

socket.onopen = () => { 
    console.log(socket);
    console.log('서버에 연결되었습니다.');
};

socket.onmessage = (event) => {
    // console.log(event.data);
    const li = document.createElement("li");
    li.style.listStyleType = "none";
    li.innerText = event.data;
    messageList.append(li);
};

socket.onclose = () => {
    console.log('서버 연결이 종료되었습니다.');
};

function toJson(type, payload) {
    const msg = {type, payload};
    return JSON.stringify(msg);
}

messageForm.addEventListener('submit', (event)=>{
    event.preventDefault() // 자바스크립트 기본동작 제거 - 여기서는 form 제출
    const input = messageForm.querySelector("input");
    socket.send(toJson("message", input.value));
    input.value = "";
}); 

nickForm.addEventListener('submit', (event)=>{
    event.preventDefault()
    const input = nickForm.querySelector("input");
    socket.send(toJson("nickname", input.value));
}); 