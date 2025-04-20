const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const audioSelect = document.getElementById('audios');

const welcome = document.getElementById('welcome');
const call = document.getElementById('call');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        // console.log(cameras);
    } catch (err) {
        console.log(err);
    }
}

async function getAudios() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audios = devices.filter(device => device.kind === 'audioinput');
        const currentAudio = myStream.getAudioTracks()[0];
        audios.forEach(audio => {
            const option = document.createElement('option')
            option.value = audio.deviceId;
            option.innerText = audio.label;
            if (currentAudio.label == audio.label) {
                option.selected = true;
            }
            audioSelect.appendChild(option);
        })
    } catch (err) {
        console.log(err);
    }
}

async function getMedia(deviceId) {
    // 기존 스트림 종료
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
        myStream = null;
    }

    const constraints = deviceId ? {
        audio: {
            deviceId: { exact: deviceId }
        },
        video: true
    } : {
        audio: true,
        video: true
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
        myFace.srcObject = myStream;
        if (!deviceId) await getAudios();
    } catch (err) {
        console.error("🎥 getMedia 에러:", err);
        alert("카메라 또는 마이크를 사용할 수 없습니다.\n권한 또는 다른 앱 확인이 필요합니다.");
    }
}

function handleMuteClick() {
    myStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
    });
    if (!muted) {
        muteBtn.innerText = "음소거 중"
        muted = true;
    } else {
        muteBtn.innerText = "소리 켜짐"
        muted = false;
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
    });
    if (cameraOff) {
        cameraBtn.innerText = "카메라 켜기"
        cameraOff = false;
    } else {
        cameraBtn.innerText = "카메라 끄기"
        cameraOff = true;
    }
}

async function handleCameraChange() {
    await getMedia(videoSelect.value);
    if (myPeerConnection) {
        const videoSender = myPeerConnection.getSenders()
            .find((sender) => sender.track.kind === "video");
        console.log(videoSender);
    }
}

async function handleAudioChange() {
    try {
        await getMedia(audioSelect.value);

        if (myPeerConnection) {
            const videoTrack = myStream?.getVideoTracks()[0]; // 비디오 트랙을 가져오고
            const audioSender = myPeerConnection.getSenders()
                .find((sender) => sender.track && sender.track.kind === "audio"); // 안전하게 검사

            if (audioSender && videoTrack) {
                audioSender.replaceTrack(videoTrack);
            } else {
                console.warn("audioSender 또는 videoTrack이 없습니다.");
            }
        }
    } catch (error) {
        console.error("handleAudioChange 중 오류:", error);
    }
}

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);
audioSelect.addEventListener('input', handleAudioChange);

/////////////////////////// Choose a room ///////////////////////////////

welcomeForm = welcome.querySelector('form');

async function initMedia() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia(); // myStream 초기화
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector('input');
    await initMedia();
    socket.emit('join_room', input.value);
    roomName = input.value; // 전역변수에 저장
    input.value = "";
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

///////////////////////// Socket Code /////////////////////////////////////

socket.on('welcome', async () => { // room에 있는 Peer들은 각자의 offer를 생성 및 제안
    console.log("👋 상대방이 방에 들어왔습니다");

    // 1. 이전 연결이 있으면 정리
    if (myPeerConnection) {
        console.log("🧹 기존 연결 정리 중...");
        myPeerConnection.getSenders().forEach(sender => sender.track?.stop());
        myPeerConnection.close();
        myPeerConnection = null;
    }

    // 2. 새 연결 생성
    makeConnection(); // myPeerConnection 새로 생성됨

    myDataChannel = myPeerConnection.createDataChannel('chat');
    myDataChannel.addEventListener('message', console.log); // message 이벤트 - send에 반응
    console.log('dataChannel 생성됨');

    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer); // 각자의 offer로 SDP(Session Description Protocol) 설정

    socket.emit('offer', offer, roomName); // 만들어진 offer를 전송
});

socket.on('offer', async (offer) => {
    myPeerConnection.addEventListener('datachannel', event => { // datachannel 감지
        myDataChannel = event.channel;
        myDataChannel.addEventListener('message', console.log);
    });
    // 'offer-answer' 핸드셰이크
    // 각 offer 마다 세션을 생성 -> 새로운 웹RTC 연결을 초기화
    // 세션 업데이트 : 원격 peer의 새로운 offer 정보로 업데이트
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer(); // offer를 받고 answer를 생성해 SDP 설정
    myPeerConnection.setLocalDescription(answer); // 각자의 peer는 local, remote를 설정
    socket.emit('answer', answer, roomName);
});

socket.on('answer', (answer) => {
    myPeerConnection.setRemoteDescription(answer); // 각 peer는 자신의 SDP 연결된 room의 SDP를 설정한다.
});

socket.on('ice', (ice) => {
    myPeerConnection.addIceCandidate(ice); // ICE(Interactive Connectivity Establishment)
});

socket.on("peer_left", () => {
    if (peerFace.srcObject) {
        peerFace.srcObject.getTracks().forEach(track => track.stop());
    }
    peerFace.srcObject = null;
    if (myPeerConnection) {
        // myPeerConnection.getSenders().forEach(sender => sender.track?.stop());
        myPeerConnection.close();
        myPeerConnection = null;
    }
    console.log("상대방이 나갔습니다");
});

////////////////////////// RTC Code /////////////////////////////////////

function makeConnection() {
    if (!myStream) {
        console.warn("❌ myStream이 없습니다. 연결 중단.");
        return;
    }

    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302'
                ]
            }
        ]
    });
    myPeerConnection.addEventListener('icecandidate', handleIce); // 두 Peer사이의 가능한 모든 경로를 수집하고 다른 Peer에 전송
    myPeerConnection.addEventListener('addstream', handleAddStream);
    myStream.getTracks().forEach(track => {
        myPeerConnection.addTrack(track, myStream);
    });
};

function handleIce(data) {
    socket.emit('ice', data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById('peerFace');
    peerFace.srcObject = data.stream;
}

// 카메라 장치 인식 확인
navigator.mediaDevices.enumerateDevices().then(devices => {
    console.log(devices.filter(d => d.kind === 'videoinput'));
});

window.addEventListener("beforeunload", () => {
    socket.emit("leave_room", roomName); // 서버에 방 나간다고 알림
    // WebRTC 연결 정리도 같이 하면 좋아
});