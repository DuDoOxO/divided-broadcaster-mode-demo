const urlParams = new URLSearchParams(window.location.search);
var roomName = urlParams.get("room");
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

var pc ;
var localStream;
var localVideo = document.getElementById('localVideo');
// just get in
socket.on('connect',()=>{
    socket.emit("watcher",null,roomName);
});


socket.on("broadcaster",(broadcastSocketId,inputRoomName)=>{
    console.log("broadcaster :",inputRoomName);
    // cehck roomName match
    if(inputRoomName !== roomName){
        alert("目前房間尚未開啟");
    }else{
        socket.emit("watcher",broadcastSocketId,roomName);
    }
});

socket.on("candidate",(candidate,socketId)=>{
    console.log("candidate on watcher");
    // let newCan =new RTCIceCandidate(candidate);
    pc.addIceCandidate(new RTCIceCandidate(candidate))
    .catch(err=>{
        console.log("add candidate error :",err);
    })
});

socket.on("offer",(bdcasterSocketId,offer)=>{
    pc = new RTCPeerConnection(pcConfigration);
    // must use setRemoteDescription to set offer firstly, then create answer
    pc.setRemoteDescription(new RTCSessionDescription(offer))
    .then(()=> pc.createAnswer())
    .then(answer=>{
        pc.setLocalDescription(answer);
        socket.emit("answer",bdcasterSocketId,answer);
    });

    pc.onicecandidate = (event)=>{
        console.log("Get icecandidate event :",event);
        if(event.candidate){
            socket.emit('candidate',bdcasterSocketId,event.candidate);
        }
    }


    // get the broadcaster stream
    pc.ontrack = (event)=>{
        document.getElementById('statusText').innerText = "Get Connection";
        localVideo.srcObject = event.streams[0];
        localStream = event.streams[0];
    };

    pc.oniceconnectionstatechange =(event)=>{
        console.log("handleIceConnectionChanged:");
        console.log(event);
        console.log("connectionState:",pc.connectionState);
        // when someone was offline or leave
        if(pc.connectionState === "connected"){
            document.getElementById('statusText').innerText = "Wait for connection...";
            pc.close();
            pc = null ;
            // close our camera and microphone
            let tracks = localStream.getTracks();
            tracks[0].stop();
            tracks[1].stop();
           alert("該房間已關閉");
        }
    }
});