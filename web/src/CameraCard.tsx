import { useEffect, useState } from "react";
import "./CameraCard.scss";

export default function CameraCard ({name, model, uid}:{name:string, model:string, uid:string}) {
  const [ddopen, setDDOpen] = useState(false);
  const [timestart, setTimestart] = useState(0);
  const [timelength, setTimelength] = useState(0);
  
  function revealDropDown() {
    setDDOpen(!ddopen);
  }

  return (
    <div className={`cameracard ${timestart === 0 ? "loading" : (timestart === undefined ? "available" : "unavailable")}`}>
      <div className="notdropdown" onClick={revealDropDown}>
        <div className="camcardleft"></div>
        <div className="camcardright">
          <span className="nameplate">{ name }</span>
          <span className="modeltext">{ model }</span>
        </div>
      </div>
      <div className={ddopen ? "dropdown open" : "dropdown"}>
        <div className="timeline">
          <span style={{width: timelength, translate: `${timestart} 0px`}} className="innertimeline"></span>
          <span className="currenttime"></span>
        </div>
        <button className="dropdownbtn reserve">Reserve</button>
        <span className="grayitalics">{uid}</span>
      </div>
    </div>
  );
}