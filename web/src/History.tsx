import { useEffect, useState } from "react";
import TimeLine from "./TimeLine";
import "./History.scss"
import "./index.scss"

type camsType = { name: string, model: string, uid: number | number, reservations: { start: number, end: number, user: string }[], starttime: number | undefined, user: string | undefined }
type leaseType = { name: string, id: number, camid: number, starttime: number, endtime: number }


export function HistoryPage() {
  const [cams, setCams] = useState<camsType[]>([]);
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

  return (
    <HistoryList cams={cams} />
  );
}

function HistoryCard({ entries, cam }: { entries: leaseType[], cam: camsType }) {
  const [ddopen, setDDOpen] = useState(false);

  const timeSpan = [25200, 54000]; // Times of day in seconds since midnight UTC (-3600000 for UTC+1)
  const dateTimeSpan = timeSpan.map(f => new Date(f * 1000)); // Make the timespan into date objects to avoid repetition
  const textTimeSpan = dateTimeSpan.map(f => f.toLocaleTimeString("no-NB", { timeStyle: "short" })); // turn it into text (military time)

  return (
    <div className={`historyCard historyCard${cam.uid}`}>
      <div className="predropdown" onClick={revealDropDown}>
        <p className="left">{cam.name}</p>
        <div className="historytimeline">
          <TimeLine date={undefined} timeSpan={timeSpan} progress={undefined} textVis={false} timeLineSpans={entries.map(f => {
            console.log(
              {
                "start": f.starttime,
                "length": f.endtime - f.starttime,
                "label": `${f.name}: ${new Date(f.starttime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
              }, timeSpan
            )
            return {
              "start": f.starttime,
              "length": f.endtime - f.starttime,
              "label": `${f.name}: ${new Date(f.starttime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
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
                  <td className="historytimeline" title={`${f.name}: ${new Date(f.starttime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`}>
                    <TimeLine date={undefined} timeSpan={timeSpan} progress={undefined} textVis={false} timeLineSpans={[
                      {
                        "start": f.starttime,
                        "length": f.endtime - f.starttime,
                        "label": `${new Date(f.starttime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}-${new Date(f.endtime * 1000).toLocaleTimeString("no-NB", { timeStyle: "short" })}`,
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

function HistoryList({ cams }: { cams: camsType[] }) {
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

  cams = JSON.parse('[{"name":"Name_sample2","model":"model_sample2","uid":2,"reservations":[]},{"name":"Name_samp0","model":"model_samp0","uid":0,"reservations":[]},{"name":"Name_sample1","model":"model_sample1","uid":1,"reservations":[]}]');

  function updateShown(uid: number) {
    const item = document.getElementById(`EquipmentSelection${uid}`);
    if (item?.classList.contains("active")) {
      item.classList.add("inactive")
      item.classList.remove("active")
      const tohide = document.getElementsByClassName(`historyCard${uid}`);
      for (let i = 0; i < tohide.length; i++) {
        tohide[i].classList.add("hidden");
      }

    } else if (item?.classList.contains("inactive")) {
      item.classList.add("active")
      item.classList.remove("inactive")
      const toshow = document.getElementsByClassName(`historyCard${uid}`);
      for (let i = 0; i < toshow.length; i++) {
        toshow[i].classList.remove("hidden");
      }
    }
  }

  return (
    <div className="split">
      <EquipmentList cams={cams} />
      <div className="cardlist historylist">
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

  function EquipmentList({ cams }: { cams: camsType[] }) {
    cams.sort((a: camsType, b: camsType) => a.name.localeCompare(b.name));
    return (
      <ol className="equipmentSelection">
        {
          cams.map(f => (
            <li title={f.model} id={`equipmentSelection${f.uid}`} className="active" onClick={() => updateShown(f.uid)}>{f.name}</li>
          ))
        }
      </ol>
    )
  }
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
  }, [loading, date]);
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
    <div id={date} className="historysublist">
      <span>{date}</span>
      {
        Array.from(map.keys()).map(f => {
          const entry = map.get(f);
          const cam = cams.find(c => {
            return c.uid == entry[0].camid;
          });
          if (cam == undefined) {
            return (<div />)
          }
          return (<HistoryCard entries={entry} cam={cam} />)
        })
      }
    </div>
  )
}
