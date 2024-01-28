import "./MessageBox.scss";

export default function ({title, body, shown, hide}: {title: string, body: string, shown: boolean, hide: () => void}) {
  return (
    <div className={`messagebox ${shown ? "shown" : ""}`}>
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="continuebtn" onClick={hide}>ok.</button>
    </div>
  );
}