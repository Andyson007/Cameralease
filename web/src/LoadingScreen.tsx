import "./LoadingScreen.scss";

export default function LoadingScreen() {
  return (
    <div className="loadingparent">
      {[0,1,2,3,4,5,6,7].map((v) => {
        return <span key={v} className="loadbarelement" style={{animationDuration:`${(v + 23.5)/24}s`, animationDelay:`${v/20}s`}}></span>
      })}
    </div>
  );
}