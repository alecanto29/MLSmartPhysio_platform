import React from "react"

const TextInfoModel = ({textInfo, className = ""}) => {
    return (

        <p className={`text-base ${className}`}>
            {textInfo}
        </p>

    );
};

export default TextInfoModel;