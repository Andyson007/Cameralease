import { Link } from "react-router-dom";
import "./Header.scss";
import { ReactComponent as Logo } from './logo.svg';
import { useEffect, useState } from "react";

export default function Header() {
  return (
    <div className="outerheader">
      <header>
        <Logo />
        <h1>camera lease dashboard - Kuben IM</h1>
      </header>
      <nav>
        <Link className="linkbtn" to="/">Home</Link>
        <Link className="linkbtn" to="/history">History</Link>
      </nav>
    </div>
  );
}