import "./Header.scss";
import { ReactComponent as Logo } from './logo.svg';

export default function Header() {

  return (
    <header>
      <Logo />
      <h1>camera lease dashboard - Kuben IM</h1>
    </header>
  );
}