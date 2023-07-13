const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
 
let myStream;
let muted = false;
let cameraOff = false;

async function getMedia(constraints) {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        myFace.srcObject = myStream; 
    } catch (err) {
        console.log(err);
    }
}

function handleMuteClick(){
    myStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
    });
    if(!muted){
        muteBtn.innerText="음소거  "
        muted = true;
    }else{ 
        muteBtn.innerText="소리 켜짐"
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
    });
    if(cameraOff){
        cameraBtn.innerText="카메라 켜기"
        cameraOff = false;
    }else{ 
        cameraBtn.innerText="카메라 끄기"
        cameraOff = true;
    }
}

getMedia();

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);