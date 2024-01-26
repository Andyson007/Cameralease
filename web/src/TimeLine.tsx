import TimelineSpan from "./TimelineSpan";
import "./TimeLine.scss";

export default function TimeLine({timeSpan, progress, textVis, timeLineSpans}: {timeSpan: number[], progress: number, textVis: boolean, timeLineSpans: number[][]}) {
  
  const dateTimeSpan = timeSpan.map(f => new Date(f*1000)); // Make the timespan into date objects to avoid repetition
  const textTimeSpan = dateTimeSpan.map(f => f.toLocaleTimeString("no-NB", {timeStyle: "short"})); // turn it into text (military time)
  
  return (
    <div className="outertimeline">
      <div className="timeline">
        {timeLineSpans.map(tls => 
          <TimelineSpan daystart={timeSpan[0]} dayend={timeSpan[1]} label="username" length={tls[1]} start={tls[0]}></TimelineSpan>
        )}
        <div style={
          {left: `${progress}%`, display: (progress >= 0 && progress <= 100 ? "" : "none")} // Current time in day in percent
        } className="currenttime"></div>
      </div>
      {textVis &&
        <div className="timelabels">
          <span>{textTimeSpan[0]}</span>
          <span>{textTimeSpan[1]}</span>
        </div>}
    </div>
  );
}