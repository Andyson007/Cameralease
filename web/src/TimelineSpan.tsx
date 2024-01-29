import "./TimelineSpan.scss";

export default function TimelineSpan({ start, length, label, daystart, dayend }: { start: number, length: number, label: string, daystart: number, dayend: number }) {

  const nowDate = new Date(new Date(start * 1000));
  const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0)

  console.log(start, length, label, daystart, dayend, nowDate);
  return (
    <span style={{
      width: `${length / (dayend - daystart) * 100}%`,
      left: `${(start - midnight.getTime() / 1000 - daystart + nowDate.getTimezoneOffset() * 60) / (dayend - daystart) * 100}%`
    }} title={label} className="timelinespan" />
  );
}
