import React, { useState } from "react";
import "../assets/styles/masteraddfilm.css";

// components/auth
import MasterAddFilmForm from "../components/films/MasterAddFilmForm";

function MasterAddFilm() {
  // Define your films state or fetch it as needed
  const [films, setFilms] = useState([]);

  // Function to add a film to the list
  const handleAddFilm = (newFilm) => {
    setFilms([...films, newFilm]);
  };

  return (
    <div className="addfilm">
      <h1>Add Film</h1>
      <MasterAddFilmForm onAddFilm={handleAddFilm} />
    </div>
  );
}

export default MasterAddFilm;
