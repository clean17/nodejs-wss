const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");

socket.onopen = () => { 
    console.log(socket);
    console.log('서버에 연결되었습니다.');
    // socket.send('클라이언트에서 메시지를 전송합니다.');
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

messageForm.addEventListener('submit', (event)=>{
    event.preventDefault() // 자바스크립트 기본동작 제거 - 여기서는 form 제출
    const input = messageForm.querySelector("input");
    socket.send(input.value);
    input.value = "";
}); 