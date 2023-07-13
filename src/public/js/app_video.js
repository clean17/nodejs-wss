const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const audioSelect = document.getElementById('audios');

let myStream;
let muted = false;
let cameraOff = false;

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
            if(currentAudio.label == audio.label){
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
    const cameraContrains = {
        video: {
            deviceId: {
                exact: deviceId,
            },
        },
        audio: true
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? audioContrains : initialConstrains);
        myFace.srcObject = myStream;
        if(!deviceId){
            await getAudios();
        }
        // await getCameras()   
    } catch (err) {
        console.log(err);
    }
}

function handleMuteClick() {
    myStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
    });
    if (!muted) {
        muteBtn.innerText = "음소거  "
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
    await getMedia(audioSelect.value);
}

getMedia();

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);
audioSelect.addEventListener('input', handleCameraChange);