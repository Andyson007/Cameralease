import { useState } from "react";
import "./CameraCard.scss";

export default function CameraCard ({name, model, uid}:{name:string, model:string, uid:string}) {
  const [ddopen, setDDOpen] = useState(false);
  
  function revealDropDown() {
    setDDOpen(!ddopen);
  }
  return (
    <div className="cameracard available">
      <div className="notdropdown" onClick={revealDropDown}>
        <div className="camcardleft"></div>
        <div className="camcardright">
          <span className="nameplate">{ name }</span>
          <span className="modeltext">{ model }</span>
        </div>
      </div>
      <div className={ddopen ? "dropdown open" : "dropdown"}>
        <button className="dropdownbtn reserve">Reserve</button>
      </div>
    </div>
  );
}