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

export default function CameraList () {
  const [cams, setCams] = useState<{name: string, model: string, uid: string | number}[]>([{name: "Loading...", model: "N/A", uid: "ffff"}]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);
  
  
  useEffect(() => {
    setLoading(false);
    return;
    if (!loading) return;
    fetch("/api/fetch").then(resp => {
      if (!resp.ok) {
        setError(resp.status);
        return;
      }
      return resp.text().then(t => 
        {
          try {
            setCams(JSON.parse(t)['cameras']);
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
      {error === 0 ? (loading ? "Loading..." : cameras.map(f => {
          return (<CameraCard name={f.name} model={f.model} uid={f.uid.toString()}></CameraCard>)
        })) : `error: ${error}`}
    </div>
  );
}