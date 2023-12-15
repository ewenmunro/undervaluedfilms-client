import React from "react";

// assets/styles
import "../assets/styles/home.css";

// components/films
import FilmListLanding from "../components/films/FilmListLanding";

// components/promo
import Promo from "../components/promo/Promo";

function Landing() {
  return (
    <div className="home">
      <h1>The Film List</h1>
      <Promo />
      <FilmListLanding />
    </div>
  );
}

export default Landing;
