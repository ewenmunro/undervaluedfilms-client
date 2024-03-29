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
      {/* Message for when I need to disable the Add Film button */}
      {/* <p>Note: I've had to disable the Add Film button because...</p> */}
      {/* Add additional <p></p> message to let users know that they can send me films to be added to The Film List by subscribing to my newsletter and sending them via a chat */}
      <AddFilmForm onAddFilm={handleAddFilm} />
    </div>
  );
}

export default AddFilm;
