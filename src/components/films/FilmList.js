import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  // Use the useNavigate hook from 'react-router-dom'
  const navigate = useNavigate();

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

  // Function to open film details modal
  const openFilmDetails = (film) => {
    // Construct the URL based on film title and year
    const urlTitle = film.title.replace(/\s+/g, "-").toLowerCase();
    const urlYear = film.release_year;
    const filmDetails = `${urlTitle}-${urlYear}`;
    const filmUrl = `/films/${filmDetails}`;

    // Pass the film as state to the FilmDetails component
    navigate(filmUrl, { state: { film } });
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

  const openSharePopup = (film) => {
    // Create a modal/pop-up for share options
    const modal = document.createElement("div");
    modal.className = "share-modal";

    // Close button for the modal
    const closeButton = document.createElement("span");
    closeButton.className = "close-button";
    closeButton.textContent = "✖️";
    closeButton.addEventListener("click", () => {
      modal.remove(); // Close the modal when clicking the close button
    });

    // Share options content
    const shareContent = document.createElement("div");
    shareContent.className = "share-content";

    const shareTitle = document.createElement("h1");
    shareTitle.textContent = `Share ${film.title}:`;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy URL";
    copyButton.addEventListener("click", () => copyFilmURL(film));

    const emailButton = document.createElement("button");
    emailButton.className = "email-button";
    emailButton.textContent = "Share via Email";
    emailButton.addEventListener("click", () => shareViaEmail(film));

    const fbButton = document.createElement("button");
    fbButton.className = "fb-button";
    fbButton.textContent = "Share on FB";
    fbButton.addEventListener("click", () => shareOnFacebook(film));

    const twitterButton = document.createElement("button");
    twitterButton.className = "twitter-button";
    twitterButton.textContent = "Share on X";
    twitterButton.addEventListener("click", () => shareOnTwitter(film));

    // Apply margin to buttons
    [copyButton, emailButton, fbButton, twitterButton].forEach((button) => {
      button.style.marginRight = "10px";
    });

    // Append elements to the modal
    shareContent.appendChild(shareTitle);
    shareContent.appendChild(copyButton);
    shareContent.appendChild(emailButton);
    shareContent.appendChild(fbButton);
    shareContent.appendChild(twitterButton);

    modal.appendChild(closeButton);
    modal.appendChild(shareContent);

    // Append the modal to the document body
    document.body.appendChild(modal);
  };

  const copyFilmURL = (film) => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const filmURL = `undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`;

    navigator.clipboard.writeText(filmURL).then(() => {
      const customAlert = document.querySelector(".custom-alert");

      if (customAlert) {
        customAlert.textContent = `${film.title} URL copied to clipboard!`;
        customAlert.style.display = "block";

        // Hide the alert after a delay (e.g., 3 seconds)
        setTimeout(() => {
          customAlert.style.display = "none";
        }, 3000);
      }
    });
  };

  const shareViaEmail = (film) => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const subject = encodeURIComponent(`Check out this film: ${film.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this film: undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = (film) => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = (film) => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      `undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
    )}`;
    window.open(shareURL, "_blank");
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
        <th>Film Info</th>
        <th>Watch Film</th>
        <th>Share Film</th>
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
          <button className="info-button" onClick={() => openFilmDetails(film)}>
            Info
          </button>
        </td>
        <td>
          {film.watch_link ? (
            <button className="watch-button" onClick={() => watchFilm(film)}>
              Watch Film
            </button>
          ) : (
            <button className="disabled-button">Link Not Available</button>
          )}
        </td>
        <td>
          <button className="share-button" onClick={() => openSharePopup(film)}>
            Share
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="film-list">
      <div className="custom-alert"></div>
      {/* <p>
        *Disclaimer: The MUBI link and all available <b>Watch Film</b> buttons
        to Amazon are affiliate links. <i>Undervalued Films</i> will make a
        commission on the sale you make through the link. It is no extra cost to
        you to use the link, it's simply another way to support{" "}
        <i>Undervalued Films</i>.
      </p> */}
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
