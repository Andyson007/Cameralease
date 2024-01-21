import { useEffect, useState } from "react";
import CameraCard from "./CameraCard";

var cameras = [
  {
    name: "blahblah",
    model: "lsakjdf",
    uid: "6a5b3f8e",
    starttime: new Date().getTime(),
  },
  {
    name: "asd",
    model: "lskaslfklakjdf",
    uid: "6a5787b3f8e",
    starttime: -1,
  },
];

export type camsType = {name: string, model: string, uid: string | number, reservations: {}[], starttime : number | undefined, user: string | undefined}

export function CameraList () {
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
      return resp.text().then(t => 
        {
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
    <div id="cameralist">
      {/*error === 0 ? */ (loading ? "Loading..." : cams.map(f => {
          return (<CameraCard key={f.uid} name={f.name} model={f.model} uid={f.uid.toString()} camobj={f}></CameraCard>)
        })) /*: `error: ${error}`*/}
    </div>
  );
}