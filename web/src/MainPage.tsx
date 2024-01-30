import { useEffect, useState } from "react";
import { CameraList } from "./CameraList";
import MessageBox from "./MessageBox";


export default function MainPage () {
  const [boxTitle, setBoxTitle] = useState("");
  const [boxBody, setBoxBody] = useState("");
  const [boxShown, setBoxShown] = useState(false);
  const [boxOptions, setBoxOptions] = useState<string[]>([]);
  const [boxChoice, setBoxChoice] = useState<string | null>(null);

  function showMessageBox(title: string, body: string) {
    setBoxTitle(title);
    setBoxBody(body);
    setBoxShown(true);
  }

  async function promptMessageBox(title: string, body: string, answers: string[]) : Promise<string> {
    setBoxTitle(title);
    setBoxBody(body);
    setBoxShown(true);
    setBoxOptions(answers);

    const answer = (resolve: (value:string)=>void) => {
      if (boxChoice != null) {
        const ans = boxChoice;
        resolve(ans);
        setBoxChoice(null);
      }
      else setTimeout(() => answer(resolve), 100);
    }

    return new Promise(answer);
  }
  
  return (
    <>
      <MessageBox title={boxTitle} body={boxBody} shown={boxShown} options={boxOptions} hide={(choice: string | null)=>{ setBoxShown(false); setBoxChoice(choice); }} />
      <CameraList alertBox={showMessageBox} promptBox={promptMessageBox} />
    </>
  );
}