const express=require('express');
const socket=require('socket.io');
const http=require('http');
const {Chess} =require('chess.js');
const path=require('path')

const app=express();
const server=http.createServer(app);

const io=socket(server, {
    cors: {
      origin: "https://chess-navy-delta.vercel.app/",
      // or with an array of origins
      // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
      credentials: true
    }})

const chess=new Chess();
let players={};
let currentPlayer='w';

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res)=>{
    res.render('index',{title:'Chess Game'});
})

io.on('connection',(uniquesocket)=>{
    console.log(uniquesocket)
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit('playerRole','w');
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit('playerRole','b');
    }
    else{
        uniquesocket.emit('spectatorRole')
    }
    uniquesocket.on('disconnect',(req,res)=>{
        if(uniquesocket.id===players.white){
            delete players.white;
        }
        else if(uniquesocket.id===players.black){
            delete players.black;
        }
    })
    uniquesocket.on('move',(move)=>{
        try {
            if(chess.turn()==='w' && uniquesocket.id!==players.white){
                return;
            }
            if(chess.turn()==='b' && uniquesocket.id!==players.black){
                return;
            }
            const result=chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                io.emit('move',move);
                io.emit('boardState',chess.fen());
            }
            else{
                uniquesocket.emit('invalidMove',move);
            }
        } catch (error) {
            uniquesocket.emit('Invalid move: ',move);
        }
    })
})

server.listen(process.env.PORT || 3000)