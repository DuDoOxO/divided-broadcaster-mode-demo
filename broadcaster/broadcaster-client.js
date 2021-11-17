const urlParams = new URLSearchParams(window.location.search);
var roomName = urlParams.get("room");
// input ws://xxx.xxx.xxx.xxx:xxxx
const singalingServerAddr = "ws://xxx.xxx.xxx.xxx:xxxx";
const socket = io(singalingServerAddr,{
    'reconnection':true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 5,
});


var pcConfigration = {
    "iceServers":[{
      "url": "stun:stun.l.google.com:19302"
    }]
  };

  var sdpConstraints = {
      "mandatory": {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true,
      }
  };

var mediaConstraints = {
    audio: true,
    video: {
        width:640,
        height:360
    }
};

var localStream ;
let localVideo = document.getElementById('localVideo');
// hold many peerCons
var pcConns = {};

(function getUserMedia(){
    try {
        let stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        let localVideo = document.getElementById("localVideo");
        localVideo.srcObject = stream ;
        localStream = stream ;
        const videoTrack = stream.getVideoTracks();
        const audioTrack = stream.getAudioTracks();
        console.log('get the camera : ',videoTrack[0].label);
        console.log('get the microphone: ',audioTrack[0].label);;
        socket.emit("broadcaster",roomName);
    } catch (error) {
        console.log("error : ",error);
    }
})()

// (function createRoom() {
//     socket.emit("broadcaster",roomName);
// })();

socket.on('watcher',(clientSocketId)=>{
    createPeerConnection(clientSocketId);
});

socket.on('answer',(clientSocketId,answer)=>{
    pcConns[clientSocketId].setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate",(candidate,clientSocketId)=>{
    // let newCan = new RTCIceCandidate(candidate);
    pcConns[clientSocketId].addIceCandidate(new RTCIceCandidate(candidate))
    .catch(err=>{
        console.log("add candidate error :",err);
    });
});

socket.on('disconnectPeerCon',(clientSocketId)=>{
    pcConns[clientSocketId].close();
    delete pcConns[clientSocketId];
});

socket.on('status-message',(message)=>{
    alert(message);
});

function createPeerConnection(clientSocketId) {
    try {
        // 1. create peerconnection
       let pc = new RTCPeerConnection(pcConfigration);
       pcConns[clientSocketId] = pc ;

       // 2. set broadcaster stream to else
       localStream.getTracks().forEach((track)=>{
        pcConns[clientSocketId].addTrack(track,localStream);
       });

       // 3. add onicecandidate handler
       pcConns[clientSocketId].onicecandidate = (event)=>{
            if(event.candidate){
                socket.emit('candidate',clientSocketId,event.candidate);
            }
        } ;
        // no need for stream from client
        // pc.ontrack = handleTracked ;
        // pc.oniceconnectionstatechange = handleConnectionChanged;

        // 4. doOffer
        pcConns[clientSocketId].createOffer(sdpConstraints)
        .then((offer)=>{
            pcConns[clientSocketId].setLocalDescription(offer)
            .then((()=>{
                socket.emit("offer",clientSocketId,offer);
            }))
        })
        .catch(err=>{
            console.log("can't set local sdp(offer) :",err);
        });
    } catch (error) {
        console.log("cant't create peer connection:",error);
        return ;
    }
}

