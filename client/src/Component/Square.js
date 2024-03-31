import React, { useState, useEffect } from "react";
import {socket} from '../App.js'

const X = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="40"
    height="40"
  >
    <line x1="4" y1="4" x2="20" y2="20" stroke="#3afacd" strokeWidth="4" />
    <line x1="20" y1="4" x2="4" y2="20" stroke="#3afacd" strokeWidth="4" />
  </svg>
);

const O = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="40"
    height="40"
  >
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="#3afacd"
      strokeWidth="4"
      fill="none"
    />
  </svg>
);

const Square = ({id,gameboard,setGameboard,playerturn,setPlayerturn,reset,setReset,playingAs,winner,winningPos,playWithComputer}) => {
  const [icon, setIcon] = useState(null);

  useEffect(() => {
    if (reset) {
      setIcon(null);
      setReset(false);
    }
  },[reset,setReset]);

  useEffect(() => {
    socket.on("received-move", ({gameboard,SquareId,playerturn}) =>{
      if(SquareId === id){
        playerturn === "x" ? setIcon(X) : setIcon(O);
        const updateboard = gameboard;
        updateboard[Math.floor(id/3)][id%3] = playerturn;
        setGameboard(updateboard);
        playerturn === "x" ? setPlayerturn("o") : setPlayerturn("x");
      } 
    })
    socket.on("received-move-by-computer", ({gameboard,Position}) => {
      const receivedId = Position[1] + Position[0]*3;
      if(id === receivedId){
        setIcon(O);
        setGameboard(gameboard);
        setPlayerturn("x");
      }
    })
  })

  function handleSquareClick() {
    if (icon == null && (playingAs === playerturn || playWithComputer) && winner === null) {
      // update icon
      const newicon = playerturn === "x" ? X : O;
      setIcon(newicon);
      // update gameboard;
      const updatedgameboard = [...gameboard];
      updatedgameboard[Math.floor(id / 3)][id % 3] = playerturn;
      setGameboard(updatedgameboard);
      // update playerturn
      const nextplayer = playerturn === "x" ? "o" : "x";
      setPlayerturn(nextplayer);
      console.log("gameboard", updatedgameboard, "playerturn", nextplayer);

      socket.emit("square-move", {gameboard, SquareId:id,playerturn,playWithComputer});
    }
  }
  return (
    <div className = {`square ${winningPos !== null && winningPos.some(([row,col]) => row === Math.floor(id / 3) && col === id%3) ? 'winning_square' : ""}`} onClick={handleSquareClick}>
      <div className="icon">{icon}</div>
    </div>
  );
};

export default Square;
