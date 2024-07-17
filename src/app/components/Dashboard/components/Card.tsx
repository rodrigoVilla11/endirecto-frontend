import React from "react";

const Card = ({logo, title, subtitle, text}: any) => {
  return (
    <button className="bg-white h-40 w-80 m-5 shadow-lg hover:shadow-2xl p-4 border-b-4 border-primary">
      <div className="flex h-1/2 items-center">
        <div className="rounded-full h-14 w-14 bg-secondary text-white flex justify-center items-center text-2xl m-5">
          {logo}
        </div>
        <div className="flex flex-col items-start">
        <h3 className="text-lg">{title}</h3>
        {subtitle && <h4 className="text-2xl text-bold">{subtitle}</h4>}
        </div>
      </div>
      <div className="h-1/2 flex justify-center items-center">
        {text && <p>{text}</p>}
      </div>
    </button>
  );
};

export default Card;
