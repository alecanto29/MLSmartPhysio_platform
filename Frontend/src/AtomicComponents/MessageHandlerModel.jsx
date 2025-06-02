import React, { useEffect } from "react";
import "../AtomicComponentsCSS/MessageHandlerStyle.css";

const MessageHandlerModel = ({ messageInfo, type = "success", onClear }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onClear) onClear();
        }, 2000);
        return () => clearTimeout(timer);
    }, [messageInfo]);

    if (!messageInfo) return null;

    return (
        <div className={`message-handler-box ${type}`}>
            {messageInfo}
        </div>
    );
};

export default MessageHandlerModel;
