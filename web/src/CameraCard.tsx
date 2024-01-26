import { useEffect, useState } from "react";
import { camsType } from "./CameraList";
import "./CameraCard.scss";
import TimeLine from "./TimeLine";

export default function CameraCard ({name, model, uid, camobj}:{name:string, model:string, uid:string, camobj: camsType}) {
  const [ddopen, setDDOpen] = useState(false);
  const [timestart, setTimestart] = useState(0);
  const [timelength, setTimelength] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [username, setUsername] = useState<string | undefined>();

  const timeSpan = [25200, 54000]; // Times of day in seconds since midnight UTC (-3600000 for UTC+1)

  let nowDate = new Date();

  function updatetimes() {
    nowDate = new Date();
    let currentTime = nowDate.getTime();
    let midnightTime = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(),0,0,0).getTime(); // Midnight today
    
    let prog = (currentTime-midnightTime-Math.min(...timeSpan)*1000 + nowDate.getTimezoneOffset()*60 * 1000) / (Math.max(...timeSpan) - Math.min(...timeSpan)) * .1 
    setProgress(prog);
  }

  function leaseCam() {

  }
  
  function revealDropDown() {
    setDDOpen(!ddopen);
  }

  useEffect(() => {
    const interval = setInterval(updatetimes, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

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
        <TimeLine progress={progress} timeSpan={timeSpan} textVis={true} timeLineSpans={[{start: 3600000, length:3600000, label: "username"}]}></TimeLine>

        {/* TIME & DATE RESERVATION */}
        <div className="choosetimelabels">
          <span className="grayitalics">from</span>
          <span className="grayitalics">to</span>
        </div>
        <div className="choosedatetime">
          <div className="from">
            <input className="fromdate" type="date" 
              onChange={(ev) => {
                let complete = ev.target.value.split('-');
                fromDate.setFullYear(parseInt(complete[0]));
                fromDate.setMonth(parseInt(complete[1])-1);
                fromDate.setDate(parseInt(complete[2]));
              }}
              defaultValue=
              {`${nowDate.getFullYear()}-${(nowDate.getMonth()+1).toString().padStart(2, "0")}-${nowDate.getDate().toString().padStart(2, "0")}`}></input>
            <input className="fromtime" type="time"
              onChange={(ev) => {
                let complete = ev.target.value.split(':');
                fromDate.setHours(parseInt(complete[0]));
                fromDate.setMinutes(parseInt(complete[1]));
              }}
              defaultValue=
              {`${nowDate.getHours().toString().padStart(2, "0")}:${nowDate.getMinutes().toString().padStart(2, "0")}`}></input>
          </div>
          <div className="to">
            <input className="todate" type="date" 
                onChange={(ev) => {
                  let complete = ev.target.value.split('-');
                  toDate.setFullYear(parseInt(complete[0]));
                  toDate.setMonth(parseInt(complete[1])-1);
                  toDate.setDate(parseInt(complete[2]));
                }}
                defaultValue={`${fromDate.getFullYear()}-${(fromDate.getMonth() + 1).toString().padStart(2, "0")}-${fromDate.getDate().toString().padStart(2, "0")}`}></input>
            <input className="totime" type="time"
                onChange={(ev) => {
                  let complete = ev.target.value.split(':');
                  toDate.setHours(parseInt(complete[0]));
                  toDate.setMinutes(parseInt(complete[1]));
                }}></input>
          </div>
        </div>
        <input type="text" placeholder="Reservees name"></input>
        <button className="dropdownbtn reserve">Reserve</button>

        {/* DEBUG (Database camera ID) */}
        <span className="grayitalics">{uid}</span>
      </div>
    </div>
  );
}