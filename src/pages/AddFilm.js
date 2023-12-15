import React, { useState } from "react";
import "../assets/styles/addfilm.css";

// components/auth
import AddFilmForm from "../components/films/AddFilmForm";

function AddFilm() {
  // Define your films state or fetch it as needed
  const [films, setFilms] = useState([]);

  // Function to add a film to the list
  const handleAddFilm = (newFilm) => {
    setFilms([...films, newFilm]);
  };

  return (
    <div className="addfilm">
      <h1>Add Film</h1>
      <AddFilmForm onAddFilm={handleAddFilm} />
    </div>
  );
}

export default AddFilm;
