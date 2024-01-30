import "./MessageBox.scss";

export default function ({title, body, shown, options, hide}: {title: string; body: string; shown: boolean; options: string[]; hide: (choice: string | null) => void}) {
  return (
    <div className="graybackdrop">
      <div className={`messagebox ${shown ? "shown" : ""}`}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div>
          { options.length == 0 ? 
              <button className="continuebtn" onClick={()=>hide(null)}>ok.</button> :
              options.map((v) => {
                return <button className="continuebtn" onClick={()=>hide(v)}> {v} </button>
              }) }
        </div>
      </div>
    </div>
  );
}