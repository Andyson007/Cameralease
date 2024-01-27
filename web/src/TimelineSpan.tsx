import "./TimelineSpan.scss";

export default function TimelineSpan ({start, length, label, daystart, dayend} : {start: number, length: number, label: string, daystart: number, dayend: number}) {

  console.log(start, length, label, daystart, dayend);

  return (
    <span style={{ width: `${length / (dayend - daystart) * 100}%`,
      left: `${start / (dayend - daystart) * 100}%` }} title={label} className="timelinespan"></span>
  );
}