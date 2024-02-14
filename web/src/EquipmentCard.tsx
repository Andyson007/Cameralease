import { useEffect, useReducer, useState } from "react";
import "./EquipmentCard.scss";
import TimeLine from "./TimeLine";

export default function EquipmentCard({ name, model, uid, user, starttime, reservations, reload, alertBox, promptBox }: { name: string, model: string, uid: number, user: string | null, starttime: number | null, reservations: { start: number, end: number, user: string }[], reload: () => void, alertBox: (title: string, body: string) => void; promptBox: (title: string, body: string, answers: string[]) => Promise<string> }) {
  const [ddopen, setDDOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fromDate] = useState(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [username, setUsername] = useState("");
  const [state, setState] = useState(0);

  const timeSpan = [25200, 54000]; // Times of day in seconds since midnight UTC (-3600000 for UTC+1)

  let midnightTime = 0;

  function updatetimes() {
    console.log("nowdate", new Date())
    let currentTime = new Date().getTime() * 0.001;
    midnightTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0).getTime() * 0.001; // Midnight today

    let prog = (currentTime - midnightTime - Math.min(...timeSpan) + new Date().getTimezoneOffset() * 60) / (Math.max(...timeSpan) - Math.min(...timeSpan)) * 100
    setProgress(prog);

  }

  async function stopStartLease() {
    if (starttime) {
      const messagebody = {
        end: Math.floor(new Date().getTime() / 1000),
        uid: uid,
      }
      const resp = await fetch("/api/lease/end", { body: JSON.stringify(messagebody), method: "POST" });
      console.log(resp, resp.status, resp.text());
    } else {
      if (username === "") {
        alertBox("Send inn?", "Brukernavnet er tomt, skriv vennsigst inn ett brukernavn");
        return;
      }
      const messagebody = {
        start: Math.floor(new Date().getTime() / 1000),
        user: username,
        uid: uid,
      }
      const resp = await fetch("/api/lease/start", { body: JSON.stringify(messagebody), method: "POST" });
      console.log(resp, resp.status, resp.text());
    }
    reload();
  }

  async function reserveOrLease() {
    if (starttime) {
      // Cancel previous
      const ans = await promptBox("Vil du avbryte", "Bare gjør dette hvis kameraet ikke er i bruk", ["Ja", "Nei"]);
      console.log(ans);
      if (ans == "Ja") {
        console.log("sjalskjg");
        // End lease
        const messagebody = {

        }
      }
      return;
    }
    if (toDate) {
      const messagebody = {
        start: Math.floor(fromDate.getTime() / 1000),
        end: Math.floor(toDate.getTime() / 1000),
        user: username,
        uid: uid,
      };
      console.log(messagebody);
      const resp = await fetch("/api/reserve", { body: JSON.stringify(messagebody), method: "POST" });
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

  useEffect(() => {
    const rightnow = new Date().getTime() / 1000;
    reservations.forEach((s) => {
      if (s.start < rightnow && s.end > rightnow) setState(2);
    });
    if (starttime != null) {
      setState(1);
    }
  }, [starttime, reservations, Math.floor(new Date().getTime() / 6000)]);
  return (
    <div className={`equipmentcard ${state === 0 ? "available" : state === 1 ? "unavailable" : "reserved"}`}>
      <div className="notdropdown" onClick={revealDropDown}>
        <div className="camcardleft"></div>
        <div className="camcardright">
          <span className="nameplate">{name}</span>
          <span className="modeltext">{model}</span>
        </div>
      </div>
      <div className={ddopen ? "dropdown open" : "dropdown"}>
        <TimeLine date={new Date()} progress={progress} timeSpan={timeSpan} textVis={true} timeLineSpans={reservations.map(r => { return { start: r.start - midnightTime, length: r.end - r.start, label: `${r.user} ${new Date(r.start * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(r.end * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}` } }).concat(starttime && user ? [{ start: starttime, length: new Date().getTime() / 1000 - starttime, label: `${user}: ${new Date(starttime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}` }] : [])} />


        {/* TIME & DATE RESERVATION */}
        <div className="choosetimelabels">
          <span className="grayitalics">fra</span>
          <span className="grayitalics">til</span>
        </div>
        <div className="choosedatetime">
          <div className="from">
            <input className="fromdate" type="date"
              onChange={(ev) => {
                let complete = ev.target.value.split('-');
                fromDate.setFullYear(parseInt(complete[0]));
                fromDate.setMonth(parseInt(complete[1]) - 1);
                fromDate.setDate(parseInt(complete[2]));
              }}
              defaultValue=
              {`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${new Date().getDate().toString().padStart(2, "0")}`} />
            <input className="fromtime" type="time"
              onChange={(ev) => {
                let complete = ev.target.value.split(':');
                fromDate.setHours(parseInt(complete[0]));
                fromDate.setMinutes(parseInt(complete[1]));
              }}
              defaultValue=
              {`${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`} />
          </div>
          <div className="to">
            <input className="todate" type="date"
              onChange={(ev) => {
                if (!toDate) setToDate(new Date());
                while (!toDate) { }
                let complete = ev.target.value.split('-');
                toDate.setFullYear(parseInt(complete[0]));
                toDate.setMonth(parseInt(complete[1]) - 1);
                toDate.setDate(parseInt(complete[2]));
              }} />
            <input className="totime" type="time"
              onChange={(ev) => {
                if (!toDate) setToDate(new Date());
                while (!toDate) { }
                let complete = ev.target.value.split(':');
                toDate.setHours(parseInt(complete[0]));
                toDate.setMinutes(parseInt(complete[1]));
              }} />
          </div>
        </div>
        <input type="text" placeholder="Reservers navn"
          onChange={(ev) => {
            console.log(ev.target.value);
            setUsername(ev.target.value);
          }} />
        <div className="buttons">
          <button className="dropdownbtn reserve" onClick={reserveOrLease}>{starttime ? "Avbryt reservasjon" : "Reserver"}</button>
          <button className="dropdownbtn lease" onClick={stopStartLease}>{starttime ? "Stopp utlån" : "lån ut"}</button>
        </div>
        {/* DEBUG (Database Equipment ID) */}
        <span className="grayitalics">{uid}</span>
      </div>
    </div>
  );
}
