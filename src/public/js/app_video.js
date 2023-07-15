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
    const initialConstrains = {
        audio: true,
        video: {
            facingMode: "user",
        },
    }
    const audioContrains = {
        audio: {
            deviceId: {
                exact: deviceId,
            },
        },
        video: true
    }
    /*     const cameraContrains = {
            video: {
                deviceId: {
                    exact: deviceId,
                },
            },
            audio: true
        } */

    try {
        // 웹캠은 사용중일때 접근 못함..
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? audioContrains : initialConstrains); // MediaStream
        // console.log("myStream 보여줘 ---------------------- ",myStream);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getAudios();
        }
        // await getCameras()   
        myStream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled
        });
    } catch (err) {
        console.log(err);
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
    await getMedia(audioSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0]; // 변경된 myStream
        const audioSender = myPeerConnection.getSenders()
            .find((sender) => sender.track.kind === "audio");
        audioSender.replaceTrack(videoTrack);
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
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer); // 각자의 offer로 SDP(Session Description Protocol) 설정
    socket.emit('offer', offer, roomName); // 만들어진 offer를 전송
});

socket.on('offer', async (offer) => {
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

////////////////////////// RTC Code /////////////////////////////////////

function makeConnection() { // 연결을 만든다.
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    'stun.l.google.com:19302',
                    'stun1.l.google.com:19302',
                    'stun2.l.google.com:19302',
                    'stun3.l.google.com:19302',
                    'stun4.l.google.com:19302'
                ]
            }
        ]
    });
    myPeerConnection.addEventListener('icecandidate', handleIce); // 두 Peer사이의 가능한 모든 경로를 수집하고 다른 Peer에 전송
    myPeerConnection.addEventListener('addstream', handleAddStream);
    myStream.getTracks().forEach(track => {
        myPeerConnection.addTrack(track, myStream)
    });
};

function handleIce(data) {
    socket.emit('ice', data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById('peerFace');
    peerFace.srcObject = data.stream;
}