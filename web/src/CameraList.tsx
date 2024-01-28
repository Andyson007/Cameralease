import { useEffect, useState } from "react";
import CameraCard from "./CameraCard";
import LoadingScreen from "./LoadingScreen";

// var cameras = [
//   {
//     name: "blahblah",
//     model: "lsakjdf",
//     uid: "6a5b3f8e",
//     starttime: new Date().getTime(),
//   },
//   {
//     name: "asd",
//     model: "lskaslfklakjdf",
//     uid: "6a5787b3f8e",
//     starttime: -1,
//   },
// ];

export type camsType = { name: string, model: string, uid: number, reservations: {start: number, end: number, user: string}[], starttime: number | undefined, user: string | undefined }

export function CameraList ({alertBox}: {alertBox: (title:string, body:string)=>void}) {

  const [cams, setCams] = useState<camsType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);
  const [reload, setReload] = useState(false);

  useEffect(() => {
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

          parsed.sort((a: camsType, b: camsType)=>a.name.localeCompare(b.name))
          setCams(parsed);

          console.log(cams);
          console.log(JSON.parse(t));

          if (reload) setReload(false);
          return "";
        }
        catch (e) {
          alertBox("Internal server error (500)", "Use the rust server to avoid this. localhost:8000");
          setError(500);
          return "";
        }
      }
      );
    });
  }, [reload]);

  return (
    <div id="cameralist">
      {/*error === 0 ? */ (error ? <LoadingScreen /> : cams.map(f => {
          return (<CameraCard key={f.uid} reload={()=>setReload(true)} name={f.name} model={f.model} uid={f.uid} reservations={f.reservations} user={f.user || null} starttime={f.starttime || null} alertBox={alertBox} />)})) /*: `error: ${error}`*/}
    </div>
  );
}
