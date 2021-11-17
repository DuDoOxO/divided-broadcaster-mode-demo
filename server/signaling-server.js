import {Server} from 'socket.io';
import {createServer} from 'http';

const httpServer = createServer();
const io = new Server(httpServer,{
    cors:{
        origin: "*", // hostname...
        methods:['GET','POST']
      }
});
var port = 3300;

// `{"broadcasterSocketId":"roomName"}`
var bdSocketId2Room = {};

// `{"socketId":"bdSocketId"}` for client
var scId2PeernRoom = {};

var room = [];
// io
// io.socket
// io.of('/')
io.on('connection',socket=>{
    console.log("connection");
    socket.on('watcher',(broadcastSocketId,watcherRoomName)=>{
        let clientSocketId = socket.id;
        if(broadcastSocketId === null){
            let bdSockets = Object.keys(bdSocketId2Room);
            let rooms = Object.values(bdSocketId2Room);
            let roomArrIndex = room.indexOf(watcherRoomName);
            let socketMapRoomIndex = rooms.indexOf(watcherRoomName);
            if(roomArrIndex !== -1 && socketMapRoomIndex !== -1){
                let bdSocket = bdSockets[socketMapRoomIndex];
                socket.to(bdSocket).emit('watcher',clientSocketId);
            }
        }else{
            let getRoom = bdSocketId2Room[broadcastSocketId];
            if(getRoom !== watcherRoomName){
                console.log('watcher broadcasterSocketId correspondance not existence ');
                return;
            }
            // in private message
            scId2PeernRoom[clientSocketId] = broadcastSocketId ;
            socket.to(broadcastSocketId).emit('watcher',clientSocketId);
        }
    });

    socket.on('offer',(clientSocketId,offer)=>{
        let bdcasterSocketId = socket.id;
        socket.to(clientSocketId).emit("offer",bdcasterSocketId,offer);
    });

    socket.on('answer',(bdcasterSocketId,answer)=>{
        let clientSocketId = socket.id;
        socket.to(bdcasterSocketId).emit("answer",clientSocketId,answer);
    });

    socket.on('candidate',(socketId,message)=>{
        socket.to(socketId).emit("candidate",message,socket.id);
    });

    socket.on('broadcaster',roomName=>{
        let broadcastSocketId = socket.id;
        // not exist
        if(bdSocketId2Room[broadcastSocketId] !== undefined){
            socket.emit("status-message","The room is existence");
        }
        // set the roomName-socketId map
        bdSocketId2Room[broadcastSocketId] = roomName ;
        // set the roomName to room
        room.push(roomName);
        socket.broadcast.emit("broadcaster",broadcastSocketId,roomName);
        console.log("broadcaster :",room);
    });

    // it will listen `disconnect` event defaultly  when the client disconnect
    socket.on('disconnect',()=>{
        // delete roomName in room and broadcasterSocketId in bdSocketId2Room map
        let roomName = bdSocketId2Room[socket.id];
        if(roomName !== undefined){
            let index = room.indexOf(roomName);
            if(index !== -1){
                room.splice(index,1);
                delete bdSocketId2Room[socket.id];
            }else{
                console.log("the room is not recorded");
            }
        }

        // delete client peerConn
        let bdcasterSocketId = scId2PeernRoom[socket.id];
        if(bdcasterSocketId === undefined ){
            console.log("can't get the correspond room for client");
        }else{
            // send to specified broadcaster in private
            socket.to(bdcasterSocketId).emit("disconnectPeerCon",socket.id);
        }
        console.log("Now the room are :",room);
    });
});

httpServer.listen(port,()=>{
    console.log("server run at port :",port);
});