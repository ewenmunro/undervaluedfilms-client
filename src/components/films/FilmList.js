import React, { useState, useEffect } from "react";
import axios from "axios";

// assets/styles
import "../../assets/styles/filmlist.css";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function FilmList() {
  const [films, setFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Function to fetch films data from the server
    const fetchFilms = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/films/allfilms`);
        const filmsData = response.data.films;

        // Calculate weighted scores for each film
        const filmsWithScores = await Promise.all(
          filmsData.map(async (film) => {
            const weightedScore = await calculateWeightedScore(film);
            return { film, weightedScore };
          })
        );

        // Sort films based on weighted scores
        const sortedFilms = filmsWithScores.sort(
          (a, b) => b.weightedScore - a.weightedScore
        );

        setFilms(sortedFilms.map((item) => item.film));
        setError(null);
      } catch (error) {
        console.error("Failed to fetch films:", error);
        setError("Failed to fetch films. Please try again later.");
      }
    };

    // Call the function to fetch and sort films when the component mounts
    fetchFilms();
  }, []);

  const calculateWeightedScore = async (film) => {
    try {
      // All declarations for The Film List Algorithm
      let notHeardBeforeCount;
      let haveHeardBeforeNotRatedCount;
      let ratingCount;
      const highestScore = 10;
      let usersTotalScore;

      // Retrieve all the users who have not heard of the film before
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/mentions/not-heard-before-count`,
          {
            params: {
              film_id: film.film_id,
            },
          }
        );

        notHeardBeforeCount = response.data.count;
      } catch (error) {
        console.error("Error fetching not heard before count:", error);
        throw error;
      }

      // Retrieve all the users who have heard of the film but haven't rated it
      try {
        const responseNotRated = await axios.get(
          `${apiBaseUrl}/api/mentions/heard-not-rated-count`,
          {
            params: {
              film_id: film.film_id,
            },
          }
        );

        haveHeardBeforeNotRatedCount = responseNotRated.data.count;
      } catch (error) {
        console.error("Error fetching heard-not-rated count:", error);
        throw error;
      }

      // Retrieve all the users who have rated the film
      try {
        // Fetch the count of ratings for the film
        const response = await axios.get(
          `${apiBaseUrl}/api/ratings/rating-count`,
          {
            params: {
              film_id: film.film_id,
            },
          }
        );

        ratingCount = response.data.count;
      } catch (error) {
        console.error("Error fetching rating count:", error);
        throw error;
      }

      // Retrieve all the users who have rated the film
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/ratings/sum-total`,
          {
            params: {
              film_id: film.film_id,
            },
          }
        );

        usersTotalScore = response.data.sum_total;
      } catch (error) {
        console.error("Error fetching rating sum total:", error);
        throw error;
      }

      // THE FILM LIST ALGORITH
      const denominator =
        Number(notHeardBeforeCount) +
        Number(haveHeardBeforeNotRatedCount) +
        Number(ratingCount);

      const weightedScore =
        denominator !== 0
          ? ((Number(notHeardBeforeCount) / denominator) * 100 +
              (Number(usersTotalScore) /
                (Number(highestScore) * Number(ratingCount)) /
                Number(ratingCount)) *
                100) /
            2
          : 0;

      return weightedScore;
    } catch (error) {
      console.error("Error calculating weighted score:", error);
      return 0;
    }
  };

  const openYouTubeTrailer = (film) => {
    // Open a new tab with the YouTube trailer search URL
    const searchQuery = `${film.title} trailer ${film.release_year}`;
    const trailerURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;
    window.open(trailerURL, "_blank");
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

  const handleSearchChange = (e) => {
    const query = e.target.value;

    // Automatically capitalize the first letter of each word
    const formattedQuery = query
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    setSearchQuery(formattedQuery);

    // Filter films based on the formatted query
    const filtered = films.filter((film) =>
      film.title.toLowerCase().startsWith(formattedQuery.toLowerCase())
    );

    if (formattedQuery && filtered.length === 0) {
      setError(`No film title matches your search query! Double-check you've input the
      correct title into the search field. Otherwise, consider adding the
      film to The Film List.`);
    } else {
      setError(false);
    }

    setFilteredFilms(filtered);
  };

  const renderTableHeader = () => {
    // Render table sub-header row
    return (
      <tr>
        <th>Film Title</th>
        <th>Year of Release</th>
        <th>Logline</th>
        <th>Film Trailer</th>
        <th>*Watch Film</th>
      </tr>
    );
  };

  const renderFilmRow = (film) => {
    return (
      <tr key={film.film_id}>
        <td>{film.title}</td>
        <td>{film.release_year}</td>
        <td>{film.description}</td>
        <td>
          <button
            className="trailer-button"
            onClick={() => openYouTubeTrailer(film)}
          >
            Watch Trailer
          </button>
        </td>
        <td>
          {film.watch_link ? (
            <button className="watch-button" onClick={() => watchFilm(film)}>
              Watch Film
            </button>
          ) : (
            <button className="disable" disabled>
              Link Not Available
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="film-list">
      <p>
        *Disclaimer: The MUBI link and all available <b>Watch Film</b> buttons
        are affiliate links. <i>Undervalued Films</i> will make a commission on
        the sale you make through the link. It is no extra cost to you to use
        the link, it's simply another way to support <i>Undervalued Films</i>.
      </p>
      <input
        type="text"
        placeholder="Search Film Title"
        className="search-input"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {error ? (
        <tr>
          <td colSpan="5">
            <p className="error-message">{error}</p>
          </td>
        </tr>
      ) : (
        <table>
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {searchQuery
              ? filteredFilms.map((film) => renderFilmRow(film))
              : films.map((film) => renderFilmRow(film))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FilmList;
