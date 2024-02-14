import { Link } from "react-router-dom";
import "./Header.scss";
import { ReactComponent as Logo } from './logo.svg';

export default function Header() {
  return (
    <div className="outerheader">
      <header>
        <Logo />
        <h1>Utlån av utstyr - Kuben IM</h1>
      </header>
      <nav>
        <Link className="linkbtn" to="/">Oversikt</Link>
        <Link className="linkbtn" to="/history">Historikk</Link>
      </nav>
    </div>
  );
}