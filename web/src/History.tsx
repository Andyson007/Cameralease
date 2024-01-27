import { useState } from "react";
import TimeLine from "./TimeLine";
import "./History.scss"

type camsType = { name: string, id: number, uid: number, starttime: number, endtime: number }
type leaseType = { name: string, id: number, camid: number, starttime: number, endtime: number }

export function HistoryPage() {
  const cams: camsType[] = JSON.parse('[{"name":"Name_samp0","model":"model_samp0","uid":1,"starttime":12312313,"user":"Andy0","reservations":[]},{"name":"Name_sample1","model":"model_sample1","uid":1,"reservations":[{"start":5,"end":7,"user":"Andy"},{"start":55,"end":75,"user":"averieyy"}]},{"name":"Name_sample2","model":"model_sample2","uid":2,"reservations":[]}]');
  const [tab, setTab] = useState(1);
  return (
    <div>
      <nav>
        {
          cams.map(f =>
            <button type="button" id={`${f.uid}`} onClick={() => changeTab(f.uid)}>{f.name}</button>
          )
        }
      </nav>
      <HistoryList camid={tab} cams={cams} />
    </div>
  )

  function changeTab(newtab: number) {
    document.getElementById(`${tab}`)?.classList.remove("selected");
    if (tab === newtab) {
      setTab(-1);
    } else {
      setTab(newtab);
      document.getElementById(`${newtab}`)?.classList.add("selected");
    }
  }
}

function HistoryCard({ entries, cam }: { entries: leaseType[], cam: camsType }) {
  const [ddopen, setDDOpen] = useState(false);

  const timeSpan = [25200, 54000]; // Times of day in seconds since midnight UTC (-3600000 for UTC+1)
  const dateTimeSpan = timeSpan.map(f => new Date(f * 1000)); // Make the timespan into date objects to avoid repetition
  const textTimeSpan = dateTimeSpan.map(f => f.toLocaleTimeString("no-NB", { timeStyle: "short" })); // turn it into text (military time)

  return (
    <div className="historyCard">
      <div className="predropdown" onClick={revealDropDown}>
        <p className="left">{cam.name}</p>
        <div className="historytimeline">
          <TimeLine timeSpan={timeSpan} progress={undefined} textVis={false} timeLineSpans={entries.map(f => {
            return {
              "start": f.starttime % 86400000,
              "length": (f.endtime - f.starttime) % 86400000,
              "label": `${f.name}: ${new Date(f.starttime).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
            }
          })} />
        </div>
      </div>
      <div className={ddopen ? "dropdown open" : "dropdown"}>
        <div className="timelabels">
          <span>{textTimeSpan[0]}</span>
          <span>{textTimeSpan[1]}</span>
        </div>
        <table>
          <tbody>
            {
              entries.map(f => {
                console.log((f.endtime - f.starttime) % 86400000);
                return <tr className="historyEntry">
                  <td>{f.name}</td>
                  <td className="historytimeline" title={`${f.name}: ${new Date(f.starttime).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime).toLocaleTimeString("no-NB", { timeStyle: "short" })}`}>
                    <TimeLine timeSpan={timeSpan} progress={undefined} textVis={false} timeLineSpans={[
                      {
                        "start": f.starttime % 86400000,
                        "length": (f.endtime - f.starttime) % 86400000,
                        "label": `${f.name}: ${new Date(f.starttime).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
                      }
                    ]} />
                  </td>
                </tr>;
              })}
          </tbody>
        </table>
      </div>
    </div>
  )

  function revealDropDown() {
    setDDOpen(!ddopen);
  }
}

function HistoryList({ camid, cams }: { camid: number, cams: camsType[] }) {
  let parsed: string[];
  if (camid === 1) {
    parsed = JSON.parse('["2009-02-13","1970-05-23"]');
  } else if (camid === 0) {
    parsed = JSON.parse('["2009-02-13","1970-05-23"]');
  } else {
    parsed = JSON.parse('[]');
  }
  const arr: string[] = [];
  parsed.forEach(f => {
    arr.push(f);
  })
  return (
    <div className="historylist">
      {
        arr.map(f => {
          return (<HistoryDate date={f} cams={cams} />)
        })
      }
    </div>
  )
}

function HistoryDate({ date, cams }: { date: string, cams: camsType[] }) {
  const parsed: leaseType[] = JSON.parse('[{"id":1,"camid":2,"starttime":1223567890,"endtime":1233567890,"name":"xX_EpicGamer_Xx"},{"id":1,"camid":1,"starttime":1230567890,"endtime":1235567890,"name":"Andy"},{"id":1,"camid":2,"starttime":1234567890,"endtime":1237977890,"name":"Andy"}]');
  const map = new Map();
  parsed.forEach(f => {
    let topush;
    if (!map.has(f.camid)) {
      topush = [];
    } else {
      topush = map.get(f.camid);
    }
    topush.push(f);
    map.set(f.camid, topush)
  });
  return (
    <div id={date} className="historylist">
      <h2>{date}</h2>
      {
        Array.from(map.keys()).map(f => {
          let entry = map.get(f);
          let cam = cams.find(c => {
            return c.uid == entry[0].camid;
          });
          if (cam == undefined) {
            return (<p>Can't find camid {entry.camid}</p>)
          }
          return (<HistoryCard entries={entry} cam={cam} />)
        })
      }
    </div>
  )
}
