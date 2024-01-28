import { useState } from "react";
import { CameraList } from "./CameraList";
import MessageBox from "./MessageBox";


export default function MainPage () {
  const [boxTitle, setBoxTitle] = useState("");
  const [boxBody, setBoxBody] = useState("");
  const [boxShown, setBoxShown] = useState(false);

  function showMessageBox(title: string, body: string) {
    setBoxTitle(title);
    setBoxBody(body);
    setBoxShown(true);
  }
  
  return (
    <>
      <MessageBox title={boxTitle} body={boxBody} shown={boxShown} hide={()=>setBoxShown(false)} />
      <CameraList alertBox={showMessageBox} />
    </>
  );
}