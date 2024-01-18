import { useEffect, useState } from "react";
import CameraCard from "./CameraCard";

const cameras = [
  {
    name: "blahblah",
    model: "lsakjdf",
    uid: "6a5b3f8e"
  },
  {
    name: "asd",
    model: "lskaslfklakjdf",
    uid: "6a5787b3f8e"
  },
];

export default function CameraList () {
  const [data, setData] = useState<{[key: string]: any}>();
  const [cams, setCams] = useState<{name: string, model: string, uid: string | number}[]>([{name: "Loading...", model: "N/A", uid: "ffff"}]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number>(0);
  
  useEffect(() => {
    fetch("/api/").then(resp => {
      setLoading(false);
      if (!resp.ok) {
        setError(resp.status);
        return;
      }
      return resp.text().then(t => 
        {
          try {
            let l = t;
            l.endsWith("!");
            setData({cams: cameras});
          }
          catch (e) {
            setError(500);
            return "";
          }
        }
      );
    });
  });

  return (
    <div id="cameralist">
      {!cams ? "Loading..." : cams.map(f => {
          return (<CameraCard name={f.name} model={f.model} uid={f.uid.toString()}></CameraCard>)
        })}
    </div>
  );
}