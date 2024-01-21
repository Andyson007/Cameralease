import "./TimelineSpan.scss";

export default function TimelineSpan ({start, length, label, daystart, dayend} : {start: number, length: number, label: string, daystart: number, dayend: number}) {

  console.log(start, length, label, daystart, dayend);

  return (
    <span style={{ width: `${length / (dayend - daystart) * .1}%`,
      left: `${(start - daystart) / (dayend - daystart) * .1}%` }} title={label} className="timelinespan"></span>
  );
}