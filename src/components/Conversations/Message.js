import React from "react";
import Avatar from "../../styles/Avatar";

const Message = ({ message }) => {
  const { senderId, messageText, messageImageUrl, timestamp } = message;

  return (
    <div className="message">
      <Avatar src={senderId.avatarUrl || "/default-avatar.png"} />
      <div>
        {messageText && <p>{messageText}</p>}
        {messageImageUrl && <img src={messageImageUrl} alt="message" />}
        
        {/* Check if timestamp exists and display date, else show 'Sending...' */}
        <span>
          {timestamp ? new Date(timestamp.toDate()).toLocaleString() : "Sending..."}
        </span>
      </div>
    </div>
  );
};

export default Message;
