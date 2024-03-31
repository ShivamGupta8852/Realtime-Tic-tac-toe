import React, { useEffect, useState } from "react";
import "../App.css";
import Square from "./Square.js";
import { socket } from "../App.js";
import Chat from "./Chat.js";

const Gameboard = ({ playingAs,playWithComputer}) => {
  const initialGameboard = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
  const [gameboard, setGameboard] = useState(initialGameboard);
  const [playerturn, setPlayerturn] = useState("x");
  const [reset, setReset] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningPos, setWinningPos] = useState(null);

  useEffect(() => {
    socket.on("restart", () => {
      setGameboard(initialGameboard);
      setPlayerturn("x");
      setReset(true);
      setWinner(null);
      setWinningPos(null);
    });
    socket.on("game-result", (gamewinner) => {
      console.log("gamewinner", gamewinner);
      if (gamewinner.PlayerWon !== "") {
        setWinner(gamewinner.PlayerWon);
        setWinningPos(gamewinner.winningPos);
      } else {
        setWinner("Draw");
      }
    });
  });

  function handleReset() {
    setGameboard(initialGameboard);
    setPlayerturn("x");
    setReset(true);
    setWinner(null);
    setWinningPos(null);
    socket.emit("restart");
  }
  function handleleave() {
    socket.emit("player-leaved",playWithComputer);
  }

  return (
    <div className="main_container">
      <div className="gameboard_container">
        <div className="heading">Tic tac toe</div>
        <div className="playerturn">
          {playingAs === "x" ? (
            <>
              <div
                className={`leftplayer ${
                  playerturn === "x" && winner === null ? "playing" : ""
                }`}
              >
                X's turn
              </div>
              <div
                className={`leftplayer ${
                  playerturn === "o" && winner === null ? "playing" : ""
                }`}
              >
                {playWithComputer === true ? "Robo's turn" : "O's turn"}
              </div>
            </>
          ) : (
            <>
              <div
                className={`leftplayer ${
                  playerturn === "o" && winner === null ? "playing" : ""
                }`}
              >
                O's turn
              </div>
              <div
                className={`leftplayer ${
                  playerturn === "x" && winner === null ? "playing" : ""
                }`}
              >
                X's turn
              </div>
            </>
          )}
        </div>
        <div className="square_container">
          {gameboard.map((line, row) => {
            return line.map((square, col) => {
              return (
                <Square
                  key={col + 3 * row}
                  id={col + 3 * row}
                  gameboard={gameboard}
                  setGameboard={setGameboard}
                  playerturn={playerturn}
                  setPlayerturn={setPlayerturn}
                  reset={reset}
                  setReset={setReset}
                  playingAs={playingAs}
                  winner={winner}
                  winningPos={winningPos}
                  playWithComputer = {playWithComputer}
                />
              );
            });
          })}
        </div>
        <div className="btns_container">
          <button className="btn" onClick={handleReset}>
            Reset
          </button>
          <button className="btn" onClick={handleleave}>
            Leave
          </button>
        </div>
        <div className="result">
          {winner === null
            ? ""
            : winner === "Draw"
            ? "It's a Draw"
            : `Player ${winner.toUpperCase()} won !!`}
        </div>
      </div>
      {/* <div>
        {playWithComputer && <Chat/>}
      </div> */}
      {playWithComputer === false && <div> <Chat/> </div>}
    </div>
  );
};

export default Gameboard;
