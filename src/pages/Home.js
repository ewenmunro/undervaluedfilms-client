import React from "react";
import "../assets/styles/home.css";

// components/films
import FilmList from "../components/films/FilmList";

// components/promo
import Promo from "../components/promo/Promo";

function Home() {
  return (
    <div className="home">
      <h1>The Film List</h1>
      <Promo />
      <FilmList />
    </div>
  );
}

export default Home;
