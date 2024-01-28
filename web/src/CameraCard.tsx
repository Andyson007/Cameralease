import { useEffect, useState } from "react";
import "./CameraCard.scss";
import TimeLine from "./TimeLine";

export default function CameraCard ({name, model, uid, user, starttime, reservations, reload, alertBox}:{name:string, model:string, uid:number, user: string | null, starttime: number | null, reservations: {start: number, end: number, user: string}[], reload: ()=>void, alertBox: (title:string, body:string)=>void}) {
  const [ddopen, setDDOpen] = useState(false);
  const [timestart, setTimestart] = useState(0);
  const [progress, setProgress] = useState(0);
  const [nowDate, setNowDate] = useState(new Date());
  const [fromDate] = useState(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [username, setUsername] = useState("");

  const timeSpan = [25200, 54000]; // Times of day in seconds since midnight UTC (-3600000 for UTC+1)

  let midnightTime = 0;

  useEffect(() => {
    if (starttime && user && starttime != null && !reservations.find((v) => v.start == starttime)) {
      reservations.push({start: starttime, end: Math.floor(nowDate.getTime()/1000), user: user})
    }
  }, [reservations, nowDate]);

  function updatetimes() {
    setNowDate(new Date());
    let currentTime = nowDate.getTime() * 0.001;
    midnightTime = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(),0,0,0).getTime() * 0.001; // Midnight today
    
    let prog = (currentTime-midnightTime-Math.min(...timeSpan) + nowDate.getTimezoneOffset()*60) / (Math.max(...timeSpan) - Math.min(...timeSpan)) * 100 
    setProgress(prog);
  }

  async function reserveOrLease () {
    if (starttime) {
      // Cancel previous
    }
    if (toDate) {
      const messagebody = {
        start: Math.floor(fromDate.getTime() / 1000),
        end: Math.floor(toDate.getTime() / 1000),
        user: username,
        uid: uid,
      };
      console.log(messagebody);
      const resp = await fetch("/api/reserve", {body: JSON.stringify(messagebody), method: "POST"});
      console.log(resp, resp.status, resp.text());
    } 
    else {
      // Effective from and to
    }

    reload();
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
        <TimeLine progress={progress} timeSpan={timeSpan} textVis={true} timeLineSpans={reservations.map(r => { return {start: r.start - midnightTime, length: r.end - r.start, label: r.user}})}></TimeLine>

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
              {`${nowDate.getFullYear()}-${(nowDate.getMonth()+1).toString().padStart(2, "0")}-${nowDate.getDate().toString().padStart(2, "0")}`} />
            <input className="fromtime" type="time"
              onChange={(ev) => {
                let complete = ev.target.value.split(':');
                fromDate.setHours(parseInt(complete[0]));
                fromDate.setMinutes(parseInt(complete[1]));
              }}
              defaultValue=
              {`${nowDate.getHours().toString().padStart(2, "0")}:${nowDate.getMinutes().toString().padStart(2, "0")}`} />
          </div>
          <div className="to">
            <input className="todate" type="date" 
                onChange={(ev) => {
                  if (!toDate) setToDate(new Date());
                  while(!toDate) {}
                  let complete = ev.target.value.split('-');
                  toDate.setFullYear(parseInt(complete[0]));
                  toDate.setMonth(parseInt(complete[1])-1);
                  toDate.setDate(parseInt(complete[2]));
                }}
                defaultValue={`${fromDate.getFullYear()}-${(fromDate.getMonth() + 1).toString().padStart(2, "0")}-${fromDate.getDate().toString().padStart(2, "0")}`} />
            <input className="totime" type="time"
                onChange={(ev) => {
                  if (!toDate) setToDate(new Date());
                  while(!toDate) {}
                  let complete = ev.target.value.split(':');
                  toDate.setHours(parseInt(complete[0]));
                  toDate.setMinutes(parseInt(complete[1]));
                }} />
          </div>
        </div>
        <input type="text" placeholder="Reservees name"
          onChange={(ev) => {
            console.log(ev.target.value);
            setUsername(ev.target.value);
          }}/>
          <button className="dropdownbtn reserve" onClick={reserveOrLease}>Reserve</button>

        {/* DEBUG (Database camera ID) */}
        <span className="grayitalics">{uid}</span>
      </div>
    </div>
  );
}