import React, { useEffect, useRef, useState } from 'react'
import { socket } from '../App';
import {InsertEmoticon,SendSharp} from '@mui/icons-material'

const Chat = () => {
  const [messages,setMessages] = useState([]);
  const [inputText,setInputText]  = useState("");
  const message_cont = useRef(null);

  useEffect(() => {
    socket.on("message-received", (message) => {
        setMessages([...messages,message])
    })
  })
  useEffect(() => {
    if(message_cont.current){
      message_cont.current.scrollTop = message_cont.current.scrollHeight;
    }
  },[messages])

  function handleSend(){
    if(inputText.trim() !== ""){
        setMessages([...messages,{text:inputText,sent:false}]);
        socket.emit("message-sent", inputText);
        setInputText('');
    }
  }
  function handleEnter(e){
    if(e.key === "Enter"){
        if(inputText.trim() !== ""){
            setMessages([...messages,{text:inputText,sent:false}]);
            socket.emit("message-sent", inputText);
            setInputText('');
        }
    }
  }
  return (
    <div className='chat_container'>
        <div className='message_container' ref={message_cont}>
            {
                messages.map((message,index) => {
                   return <div key={index} className={`message ${message.sent ? "right_align" : "left_align"}`}>
                        {message.text}
                    </div>
                })
            }
        </div>
        <div className='chat_btns_cont'>
            <div className='icon_msg_input-cont'>
              <button className='smile-icon-btn'><InsertEmoticon/></button>
              <input type="text" className="msg_input" placeholder='Type a message' value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleEnter}/>
            </div>
            <button className={`send_btn ${inputText.trim() !== "" ? "typedSomething" : ""}`} onClick={handleSend}><SendSharp sx={{ fontSize: 20 }} className='send_icon'/></button>
        </div>
    </div>
  )
}

export default Chat;