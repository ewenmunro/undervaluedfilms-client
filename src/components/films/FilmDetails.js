import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/filmdetails.css";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const FilmDetails = () => {
  const { filmDetails } = useParams();
  const [film, setFilm] = useState(null);

  useEffect(() => {
    const fetchFilmDetails = async () => {
      try {
        // Extract the last 4 digits as year and the rest as title
        let year = filmDetails.slice(-5);
        let title = filmDetails.slice(0, -5);

        year = year.replace(/-/g, "");

        // Replace each '-' with a space
        title = title
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Make an API request to fetch film details based on title and year
        const response = await axios.get(
          `${apiBaseUrl}/api/films/filmdetails`,
          {
            params: {
              title,
              year,
            },
          }
        );

        setFilm(response.data.film);
      } catch (error) {
        console.error("Failed to fetch film details:", error);
      }
    };

    fetchFilmDetails();
  }, [filmDetails]);

  // Check if film is defined
  if (!film) {
    // Handle the case where film is not available
    return (
      <div>
        <p className="film-details-error-message">
          Error: Film details not available.
        </p>
      </div>
    );
  }

  const openYouTubeTrailer = (film) => {
    // Open a small window with the YouTube trailer search URL
    const searchQuery = `${film.title} trailer ${film.release_year}`;
    const trailerURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;

    // Define the window dimensions
    const windowWidth = 600;
    const windowHeight = 400;

    // Calculate the center position of the window
    const windowLeft = (window.innerWidth - windowWidth) / 2 + window.screenX;
    const windowTop = (window.innerHeight - windowHeight) / 2 + window.screenY;

    // Open the new window
    window.open(
      trailerURL,
      "_blank",
      `width=${windowWidth}, height=${windowHeight}, top=${windowTop}, left=${windowLeft}`
    );
  };

  const watchFilm = (film) => {
    // Check if there's a valid link in the database for this film
    if (film.watch_link) {
      // Make a request to generate a temporary identifier for a logged-out user
      axios
        .get(`${apiBaseUrl}/api/watch/generatetempid`)
        .then((response) => {
          // Retrieve temporary user id from backend
          const temporaryUserId = response.data.temporaryUserId;

          // Open the film link in a new tab
          window.open(film.watch_link, "_blank");

          // Make an API request to log the click
          axios.post(`${apiBaseUrl}/api/watch/click`, {
            user_id: temporaryUserId,
            film_id: film.film_id,
          });
        })
        .catch((error) => {
          console.error("Failed to generate a temporary identifier:", error);
        });
    }
  };

  const copyFilmURL = () => {
    const filmURL = window.location.href;
    navigator.clipboard.writeText(filmURL).then(() => {
      const customAlert = document.querySelector(".custom-alert");
      customAlert.textContent = `${film.title} URL copied to clipboard!`;
      customAlert.style.display = "block";

      // Hide the alert after a delay (e.g., 3 seconds)
      setTimeout(() => {
        customAlert.style.display = "none";
      }, 3000);
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this film: ${film.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this film: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = () => {
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      window.location.href
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = () => {
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      window.location.href
    )}`;
    window.open(shareURL, "_blank");
  };

  return (
    <div className="film-details">
      <h1>{film.title}</h1>
      <p>
        <b>Year of Release:</b> {film.release_year}
      </p>
      <p>
        <b>Logline:</b> {film.description}
      </p>
      <p>
        <b>Watch Trailer:</b>
      </p>
      <button
        className="film-details-trailer-button"
        onClick={() => openYouTubeTrailer(film)}
      >
        Watch Trailer
      </button>
      {/* <p>
        *Disclaimer: If the <b>Watch Film</b> button is available and goes to
        Amazon, then it is an affiliate link. <i>Undervalued Films</i> will make
        a commission on the sale you make through the link. It is no extra cost
        to you to use the link, it's simply another way to support{" "}
        <i>Undervalued Films</i>.
      </p> */}
      <p>
        <b>Watch Film:</b>
      </p>
      {film.watch_link ? (
        <button
          className="film-details-watch-button"
          onClick={() => watchFilm(film)}
        >
          Watch Film
        </button>
      ) : (
        <button className="film-details-film-details-disable" disabled>
          Link Not Available
        </button>
      )}
      <p>
        <b>Share Film:</b>
      </p>
      <div className="film-details-share-buttons">
        <button className="film-details-copy-button" onClick={copyFilmURL}>
          Copy URL
        </button>
        <button className="film-details-email-button" onClick={shareViaEmail}>
          Share via Email
        </button>
        <button className="film-details-fb-button" onClick={shareOnFacebook}>
          Share on FB
        </button>
        <button
          className="film-details-twitter-button"
          onClick={shareOnTwitter}
        >
          Share on X
        </button>
      </div>
      <div className="custom-alert"></div>
    </div>
  );
};

export default FilmDetails;
