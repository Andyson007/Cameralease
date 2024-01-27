import "./TimelineSpan.scss";

export default function TimelineSpan ({start, length, label, daystart, dayend} : {start: number, length: number, label: string, daystart: number, dayend: number}) {

  console.log(start, length, label, daystart, dayend);
  let nowDate = new Date();
  let midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0)

  return (
    <span style={{ width: `${length / (dayend - daystart) * 100}%`,
      left: `${(start - midnight.getTime()/1000 - daystart+nowDate.getTimezoneOffset()*60) / (dayend - daystart) * 100}%` }} title={label} className="timelinespan"></span>
  );
}