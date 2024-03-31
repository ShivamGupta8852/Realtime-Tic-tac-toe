import React, { useEffect, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import Gameboard from "./Component/Gameboard";
import Swal from 'sweetalert2';

export let socket = io("http://localhost:8000");

const App = () => {
  const [isPlayerOnline, setIsPlayerOnline] = useState(false);
  const [hasClickedPlayOnline, sethasClickedPlayOnline] = useState(false);
  const [playingAs, setPlayingAs] = useState("");
  const [playWithComputer,setPlayWithComputer] = useState(false);

  useEffect(() => {
    socket.on("startGame", () => {
      setIsPlayerOnline(true);
    })
    socket.on("waiting-opponent", () => {
      setIsPlayerOnline(false);
    })
    socket.on("OtherPlayer-leaved", () => {
      setIsPlayerOnline(false);
      sethasClickedPlayOnline(false);
    })
    socket.on("Play-as", (data) => {
      setPlayingAs(data);
      console.log("I am playing as : ", playingAs);
    })
    socket.on("room-full", () => {
      sethasClickedPlayOnline(false);
      Swal.fire({
        icon: 'info',
        title: 'Room Full',
        text: 'This room already has two players.',
        confirmButtonText: 'OK'
      });
    })
    socket.on("leave-room", () => {
      setIsPlayerOnline(false);
      sethasClickedPlayOnline(false);
      setPlayWithComputer(false);
    })
  })

  function handlePlayOnline() {
    setPlayWithComputer(false);
    sethasClickedPlayOnline(true);
    socket.emit("play-online");
  }
  async function handleInviteFriends(){
    const { value: roomname } = await Swal.fire({
      title: "Input your Room",
      input: "text",
      inputPlaceholder: "Enter your room",
      showCancelButton: true,
      theme: "dark",
      inputValidator: (value) => {
        if (!value) {
          return "Need to enter some roomname!";
        }
      }
    });
    if (roomname) {
      setPlayWithComputer(false);
      sethasClickedPlayOnline(true);
      socket.emit("Invite-friend", roomname);
    }
  }
  function handlePlayWithComputer(){
    setPlayWithComputer(true);
    sethasClickedPlayOnline(true);
    setPlayingAs("x");
    setIsPlayerOnline(true);
    // socket.emit("play-with-computer");
  }

  if(isPlayerOnline === false){
    return hasClickedPlayOnline === false ? (
      <div className="playerMode_container">
        <div className="playerMode_heading">Welcome to Tic Tac Toe game</div>
        <div className="playerMode_button" onClick={handlePlayOnline}>Play Online</div>
        <div className="playerMode_button" onClick={handleInviteFriends}>Invite/Join friend</div>
        <div className="playerMode_button" onClick={handlePlayWithComputer}>Play with Computer</div>
      </div>
    ) :
    <div className="waiting">Waiting for opponent....!!</div>
  }
  else{
    return (
      <Gameboard playingAs = {playingAs} playWithComputer = {playWithComputer}/>
    );
  }

};

export default App;
