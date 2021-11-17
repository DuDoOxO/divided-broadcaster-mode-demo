import express from 'express';
const app = express();
import path  from 'path';
const port = 3333;

const __dirname = path.resolve();
app.use(express.static("."));

app.get("/watcher",(req,res)=>{
    let roomName = req.query.room;
    if(roomName !== undefined){
        res.sendFile(path.join(__dirname,"/watcher-client.html"));
    }else{
        res.send(" The room is not available. please add your room code");
    }
});


app.listen(port,()=>{
    console.log("server run at: ",port);
});