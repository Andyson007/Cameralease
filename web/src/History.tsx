import { useEffect, useState } from "react";
import TimeLine from "./TimeLine";
import "./History.scss"

type camsType = { name: string, model: string, uid: string | number, reservations: {start: number, end: number, user: string}[], starttime: number | undefined, user: string | undefined }
type leaseType = { name: string, id: number, camid: number, starttime: number, endtime: number }

export function HistoryPage() {
  const [cams, setCams] = useState<camsType[]>([{name: "Loading...", model: "N/A", uid: "ffff", reservations: [], starttime: undefined, user: undefined}]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);

  useEffect(() => {
    setLoading(false);
    // return;
    if (!loading) return;
    fetch("/api/cams").then(resp => {
      if (!resp.ok) {
        setError(resp.status);
        return;
      }
      return resp.text().then(t => {
        try {
          let parsed = JSON.parse(t);

          console.log(parsed);
          if (!(parsed instanceof Array)) setError(500);

          setCams(parsed);

          setLoading(false);
          console.log(cams);
          console.log(JSON.parse(t));
          return "";
        }
        catch (e) {
          setError(500);
          return "";
        }
      }
      );
    });
  }, [loading, cams]);
  const [tab, setTab] = useState(1);
  return (
    <div>
      {
        // <nav>
        //   {
        //     cams.map(f =>
        //       <button type="button" id={`${f.uid}`} onClick={() => changeTab(f.uid)}>{f.name}</button>
        //     )
        //   }
        // </nav>
      }
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
              "start": f.starttime % 86400 - timeSpan[0],
              "length": (f.endtime - f.starttime) % 86400,
              "label": `${f.name}: ${new Date(f.starttime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
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
                return <tr className="historyEntry">
                  <td>{f.name}</td>
                  <td className="historytimeline" title={`${f.name}: ${new Date(f.starttime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`}>
                    <TimeLine timeSpan={timeSpan} progress={undefined} textVis={false} timeLineSpans={[
                      {
                        "start": f.starttime % 86400 - timeSpan[0] ,
                        "length": (f.endtime - f.starttime) % 86400,
                        "label": `${new Date(f.starttime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime*1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
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
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);

  useEffect(() => {
    setLoading(false);
    // return;
    if (!loading) return;
    fetch("/api/date").then(resp => {
      if (!resp.ok) {
        setError(resp.status);
        return;
      }
      return resp.text().then(t => {
        try {
          let parsed = JSON.parse(t);
          console.log(parsed);

          console.log(parsed);
          if (!(parsed instanceof Array)) setError(500);
          setDates(parsed);

          setLoading(false);
          return "";
        }
        catch (e) {
          setError(500);
          return "";
        }
      }
      );
    });
  }, [loading]);

  return (
    <div className="split">
      <div className="historylist">
        {
          dates.map(f => {
            return (<HistoryDate date={f} cams={cams} />)
          })
        }
      </div>
      <ol className="tableOfContent">
        {
          dates.map(f => <li><a href={`#${f}`}>{f}</a></li>)
        }
      </ol>
    </div>
  )
}

function HistoryDate({ date, cams }: { date: string, cams: camsType[] }) {
  const [leases, setLeases] = useState<leaseType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);

  useEffect(() => {
    setLoading(false);
    // return;
    if (!loading) return;
    fetch(`/api/date/${date}`).then(resp => {
      if (!resp.ok) {
        setError(resp.status);
        return;
      }
      return resp.text().then(t => {
        try {
          let parsed = JSON.parse(t);

          if (!(parsed instanceof Array)) setError(500);
          setLeases(parsed);

          setLoading(false);
          return "";
        }
        catch (e) {
          setError(500);
          return "";
        }
      }
      );
    });
  }, [loading]);
  const map = new Map();
  leases.forEach(f => {
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
