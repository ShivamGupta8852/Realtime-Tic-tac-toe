import express from 'express';
import {createServer} from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server,{
    cors:{
        origin:["http://localhost:3000"],
    }
});

const players = [];
const onlinePlayersRooms = {};             // object to store the rooms of online playing team

io.on("connection", (socket) => {
    console.log(`New player joined : ${socket.id}`);

    socket.on("play-online" , () =>{
        const roomWithSinglePlayer = findRoomWithSingleplayer();
        console.log("room with single player =  ", roomWithSinglePlayer);
        if(roomWithSinglePlayer){
            socket.join(roomWithSinglePlayer);
            onlinePlayersRooms[roomWithSinglePlayer].push(socket.id);
            socket.emit("Play-as", "o");
            io.to(roomWithSinglePlayer).emit("startGame");
        }
        else{
            const newroom = "room-" + Date.now();
            onlinePlayersRooms[newroom] = [socket.id];       // store the new created room to onlinePlayersRooms with single player(socket)
            socket.join(newroom);    // join the socket to newly created room
            socket.emit("Play-as", "x");
            socket.emit("waiting-opponent");
        }
    })

    socket.on("Invite-friend" , (roomname) => {
        const isRoomExist = checkRoomExist(roomname);
        if(isRoomExist && onlinePlayersRooms[roomname].length === 2){
            socket.emit("room-full");
        }
        if(isRoomExist && onlinePlayersRooms[roomname].length === 1){
            socket.join(roomname);
            onlinePlayersRooms[roomname].push(socket.id);
            socket.emit("Play-as", "o");
            io.to(roomname).emit("startGame");
        }
        else if(!isRoomExist){
            onlinePlayersRooms[roomname] = [socket.id];
            socket.join(roomname);
            socket.emit("Play-as", "x");
            socket.emit("waiting-opponent");
        }
    })

    socket.on("message-sent", (message) => {
        const {roomOfSocket,index} = findRoomOfSocket(socket.id);
        socket.to(roomOfSocket).emit("message-received",{text:message,sent:true});
    })

    socket.on("square-move", ({gameboard,SquareId,playerturn,playWithComputer}) => {
        const {roomOfSocket,index}= findRoomOfSocket(socket.id);
        if(roomOfSocket !== null){
            const gamewinner = checkDrawOrWinner(gameboard);
            socket.to(roomOfSocket).emit("received-move",{gameboard,SquareId,playerturn});           // emit to except socket itself
            if(gamewinner !== null){
                io.to(roomOfSocket).emit("game-result",gamewinner);
            } 
        }
        if(playWithComputer){
            const gamewinner = checkDrawOrWinner(gameboard);
            if(gamewinner === null){
                const defendingPossibleMove = ComputerPosssibleMove(gameboard,"x");
                if(defendingPossibleMove === null){
                    const winningPosition = ComputerPosssibleMove(gameboard, "o");
                    if(winningPosition === null){
                        const randomPosition = emptySquares(gameboard);
                        console.log("randomPosition",randomPosition);
                        gameboard[randomPosition[0]][randomPosition[1]] = "o";
                        console.log("GameBoard After randomPosition",gameboard);
                        const gamewinner = checkDrawOrWinner(gameboard);
                        if(gamewinner !== null){
                            socket.emit("game-result",gamewinner);
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: randomPosition });
                            }, 1000);   // winning ke baad update bhi ho jaye
                        }
                        else{
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: randomPosition });
                            }, 1000); 
                        }
                    }
                    else{
                        console.log("winningPosition",winningPosition);
                        gameboard[winningPosition[0]][winningPosition[1]] = "o";
                        console.log("GameBoard After winningPosition",gameboard);
                        const gamewinner = checkDrawOrWinner(gameboard);
                        if(gamewinner !== null){
                            socket.emit("game-result",gamewinner);
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: winningPosition });
                            }, 1000);   // winning ke baad update bhi ho jaye
                        }
                        else{
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: winningPosition });
                            }, 1000);
                        }
                    }
                }   
                else{
                    console.log("defendingPossibleMove",defendingPossibleMove);
                    gameboard[defendingPossibleMove[0]][defendingPossibleMove[1]] = "o";
                    console.log("GameBoard After defendingPossibleMove",gameboard);
                        const gamewinner = checkDrawOrWinner(gameboard);
                        if(gamewinner !== null){
                            socket.emit("game-result",gamewinner)
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: defendingPossibleMove });
                            }, 1000);  // winning ke baad update bhi ho jaye
                        }
                        else{
                            setTimeout(() => {
                                socket.emit("received-move-by-computer", { gameboard, Position: defendingPossibleMove });
                            }, 1000);
                        }
                }  
            }
            else{
                socket.emit("game-result",gamewinner);
            }
        }
    })

    socket.on("player-leaved", (playWithComputer) => {
        const {roomOfSocket,index} = findRoomOfSocket(socket.id);
        io.to(roomOfSocket).emit("leave-room");
        delete onlinePlayersRooms[roomOfSocket];
        if(playWithComputer){
            socket.emit("leave-room");
        }
    })

    socket.on("restart" , () => {
        const {roomOfSocket,index}= findRoomOfSocket(socket.id);
        if(roomOfSocket !== null){
            socket.to(roomOfSocket).emit("restart");           // emit to setgameboard to initialgameboard except socket itself
        }
    })

    socket.on("disconnect", () => {
        const {roomOfSocket,index} = findRoomOfSocket(socket.id);
        if(roomOfSocket !== null){
            console.log("disconnected room = ",roomOfSocket," and indexofsocket = ", index);
            socket.to(roomOfSocket).emit("OtherPlayer-leaved");
            delete onlinePlayersRooms[roomOfSocket];   // as any player of the room leave then delete the room
            // onlinePlayersRooms[roomOfSocket].splice(index,1);
            // socket.leave(roomOfSocket);
            // if(io.sockets.adapter.rooms.get(roomOfSocket).size === 0){
            //     io.of('/').adapter.del(roomOfSocket);
            // }
            // if(onlinePlayersRooms[roomOfSocket].length === 0){
            //    delete onlinePlayersRooms[roomOfSocket];
            // } 
        }
    })


})

function findRoomWithSingleplayer(){
    for(const room in onlinePlayersRooms){
        if(onlinePlayersRooms[room].length === 1){
            return room;
        }
    }
    return null;
}

function checkRoomExist(roomname){
    for (const room in onlinePlayersRooms) {
        if(room === roomname) return true;
    }
    return false;
}

function findRoomOfSocket(socketId){
    for(const roomOfSocket in onlinePlayersRooms){
        const index = onlinePlayersRooms[roomOfSocket].indexOf(socketId);
        if(index !== -1){
            return {roomOfSocket,index};
        }
    }
    return {roomOfSocket:null,index:null};
}

function checkDrawOrWinner(gameboard){
    let emptyRowCount = 0;
    // check rows and columns and draw
    for (let i = 0; i < 3; i++) {
        if(gameboard[i][0] === gameboard[i][1] && gameboard[i][1] === gameboard[i][2] && gameboard[i][0] !== ''){
            // return gameboard[i][0];
            return {PlayerWon : gameboard[i][0] , winningPos : [[i,0],[i,1],[i,2]]};
        }
        if(gameboard[i][0] !== '' && gameboard[i][1] !== '' && gameboard[i][2] !== '') emptyRowCount++;
        if(gameboard[0][i] === gameboard[1][i] && gameboard[1][i] === gameboard[2][i] && gameboard[0][i] !== ''){
            return {PlayerWon : gameboard[0][i] , winningPos : [[0,i],[1,i],[2,i]]};
        }      
    }

    // check diagonals
    if(gameboard[0][0] === gameboard[1][1] && gameboard[0][0] === gameboard[2][2] && gameboard[1][1] !== ''){
        return {PlayerWon : gameboard[1][1] , winningPos : [[0,0],[1,1],[2,2]]};
    }
    if(gameboard[0][2] === gameboard[1][1] && gameboard[0][2] === gameboard[2][0] && gameboard[1][1] !== ''){
        return {PlayerWon : gameboard[1][1] , winningPos : [[0,2],[1,1],[2,0]]};
    }

    if(emptyRowCount === 3) return {PlayerWon : ''};
    return null;

}

function ComputerPosssibleMove(gameboard,playerturn){
    for(let i = 0;  i < 3 ; i++){
        // checking row
        if(gameboard[i][0] === gameboard[i][1] && gameboard[i][0] === playerturn && gameboard[i][2] === "") return [i,2];
        if(gameboard[i][1] === gameboard[i][2] && gameboard[i][1] === playerturn && gameboard[i][0] === "") return [i,0];
        if(gameboard[i][0] === gameboard[i][2] && gameboard[i][0] === playerturn && gameboard[i][1] === "") return [i,1];

        //checking column
        if(gameboard[0][i] === gameboard[1][i] && gameboard[0][i] === playerturn && gameboard[2][i] === "") return [2,i];
        if(gameboard[1][i] === gameboard[2][i] && gameboard[1][i] === playerturn && gameboard[0][i] === "") return [0,i];
        if(gameboard[0][i] === gameboard[2][i] && gameboard[0][i] === playerturn && gameboard[1][i] === "") return [1,i];
    }

    //checking first diagonal
    if(gameboard[0][0] === gameboard[1][1] && gameboard[0][0] === playerturn && gameboard[2][2] === "") return [2,2];
    if(gameboard[1][1] === gameboard[2][2] && gameboard[1][1] === playerturn && gameboard[0][0] === "") return [0,0];
    if(gameboard[0][0] === gameboard[2][2] && gameboard[0][0] === playerturn && gameboard[1][1] === "") return [1,1];

    // checking second diagonal
    if(gameboard[0][2] === gameboard[1][1] && gameboard[0][2] === playerturn && gameboard[2][0] === "") return [2,0];
    if(gameboard[1][1] === gameboard[2][0] && gameboard[1][1] === playerturn && gameboard[0][2] === "") return [0,2];
    if(gameboard[0][2] === gameboard[2][0] && gameboard[0][2] === playerturn && gameboard[1][1] === "") return [1,1];

    return null;
}

function emptySquares(gameboard){
    let emptyArray = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if(gameboard[i][j] === "") emptyArray.push([i,j]);
        }
    }
    const randomIndex = Math.floor(Math.random() * emptyArray.length);
    return emptyArray[randomIndex];
}


// fumction to find a room of single player and if not exits then create new room
// function findOrCreateRoom(){
//     for(const room of io.sockets.adapter.rooms.keys()){
//         if(io.sockets.adapter.rooms.get(room).size === 1) return room;       // return 1 player room
//     }
//     return "room-" + Date.now();      // create a new room
// }

// function findRoom(socketId){
//     for(const room of io.sockets.adapter.rooms.keys()){
//         if(io.sockets.adapter.rooms.get(room).has(socketId))  return room;
//     }
//     return null;
// }

server.listen(8000, () => {
    console.log("server is listening on port:8000");
})