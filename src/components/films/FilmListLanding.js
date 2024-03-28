import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/filmlistdashboard.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function FilmListLanding() {
  const [films, setFilms] = useState([]);
  const [filterOption, setFilterOption] = useState("all");
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedFilms, setDisplayedFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filmsSorted, setFilmsSorted] = useState(false);
  const [message, setMessage] = useState("");

  const { isAuthenticated } = useAuth();

  // Use the useNavigate hook from 'react-router-dom'
  const navigate = useNavigate();

  const handleInitialMentionButtonState = useCallback(
    async (film) => {
      try {
        // Make an API request to check if the user has mentioned the film
        const response = await axios.get(
          `${apiBaseUrl}/api/mentions/checkmentioned`,
          {
            params: {
              user_id: isAuthenticated.user.user_id,
              film_id: film.film_id,
            },
          }
        );

        const hasMentioned = response.data.hasMentioned;

        if (hasMentioned === true || hasMentioned === false) {
          const mentionButton = document.querySelector(
            `#mention-button-${film.film_id}`
          );

          if (mentionButton) {
            mentionButton.disabled = true;
            mentionButton.textContent = "Mentioned";
            mentionButton.classList.add("disabled-button");
          }
        }
      } catch (error) {
        console.error("Failed to check mention status:", error);
      }
    },
    [isAuthenticated.user.user_id]
  );

  // Handle filter option change
  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  const updateDisplayedFilms = useCallback(async () => {
    try {
      setLoading(true);

      let updatedFilms = films;

      // Apply filter option
      switch (filterOption) {
        case "notRated":
          if (isAuthenticated && isAuthenticated.user) {
            const notRatedResponse = await axios.get(
              `${apiBaseUrl}/api/ratings/not-rated`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedFilms = notRatedResponse.data.films;
          }
          break;

        case "notMentioned":
          if (isAuthenticated && isAuthenticated.user) {
            const notMentionedResponse = await axios.get(
              `${apiBaseUrl}/api/mentions/not-mentioned`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedFilms = notMentionedResponse.data.films;
          }
          break;

        case "notHeardBefore":
          if (isAuthenticated && isAuthenticated.user) {
            const notHeardBeforeResponse = await axios.get(
              `${apiBaseUrl}/api/mentions/not-heard-before`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedFilms = notHeardBeforeResponse.data.films;
          }
          break;

        case "all":
        default:
        // If no filter is applied, do nothing
      }

      // Apply search filter if there is a search query
      if (searchQuery) {
        updatedFilms = updatedFilms.filter((film) =>
          film.title.toLowerCase().startsWith(searchQuery.toLowerCase())
        );
      }

      // Update the displayedFilms state
      setDisplayedFilms(updatedFilms);
    } catch (error) {
      console.error("Failed to update displayed films:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterOption, films, isAuthenticated]);

  useEffect(() => {
    // Function to fetch films data from the server
    const fetchFilms = async () => {
      try {
        setLoading(true);

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

        // Check and disable Mention buttons for films already mentioned by the user
        sortedFilms.forEach((film) => {
          handleInitialMentionButtonState(film);
        });

        setFilmsSorted(true);
        updateDisplayedFilms();
      } catch (error) {
        console.error("Failed to fetch films:", error);
        setError("Failed to fetch films. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // Call the function to fetch and sort films when the component mounts
    fetchFilms();
  }, [
    handleInitialMentionButtonState,
    searchQuery,
    filterOption,
    films,
    isAuthenticated,
    updateDisplayedFilms,
  ]);

  // Function to calculate the weighted score for a film
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
    const filmUrl = `/films/private/${filmDetails}`;

    // Pass the film as state to the FilmDetails component
    navigate(filmUrl, { state: { film } });
  };

  const handleMention = async (film) => {
    try {
      // Make an API request to check if the user has mentioned the film
      const response = await axios.get(
        `${apiBaseUrl}/api/mentions/checkmentioned`,
        {
          params: {
            user_id: isAuthenticated.user.user_id,
            film_id: film.film_id,
          },
        }
      );

      const hasMentioned = response.data.hasMentioned;

      if (hasMentioned === true || hasMentioned === false) {
        // If the user has already mentioned the film, disable the buttons and return
        const mentionButton = document.querySelector(
          `#mention-button-${film.film_id}`
        );

        if (mentionButton) {
          mentionButton.disabled = true;
          mentionButton.textContent = "Mentioned";
          mentionButton.classList.add("disabled-button");
        }

        return;
      }

      // Modal/pop-up for mentioning if the user hasn't mentioned before
      const modal = document.createElement("div");
      modal.className = "mention-modal";

      // Close button for the modal
      const closeButton = document.createElement("span");
      closeButton.className = "close-button";
      closeButton.textContent = "✖️";
      closeButton.addEventListener("click", () => {
        modal.remove(); // Close the modal when clicking the close button
      });

      // Mention question
      const mentionQuestion = document.createElement("div");
      mentionQuestion.className = "mention-question";
      mentionQuestion.textContent = `Have you heard of ${film.title} before visiting undervaluedfilms.com?`;

      // Disclaimer
      const disclaimer = document.createElement("div");
      disclaimer.className = "disclaimer";
      disclaimer.textContent =
        "Note: Once you have answered the question, you won't be able to edit your answer. Please make sure you answer this question correctly.";

      // Yes button
      const yesButton = document.createElement("button");
      yesButton.textContent = "Yes";
      yesButton.addEventListener("click", async () => {
        // Handle the 'Yes' answer
        try {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedFilms([]);
          setMessage("Your Mention request is being processed...");

          await axios.post(
            `${apiBaseUrl}/api/mentions/mentioned`,
            {
              user_id: isAuthenticated.user.user_id,
              film_id: film.film_id,
              mentioned: true,
            },
            {
              headers: {
                Authorization: `Bearer ${isAuthenticated.token}`,
              },
            }
          );

          // Hide loading message and show table content after the user answers
          setLoading(false);
          setMessage("");
          updateDisplayedFilms();
        } catch (error) {
          console.error("Failed to update mention status:", error);
        }

        modal.remove(); // Close the modal after answering
      });

      // No button
      const noButton = document.createElement("button");
      noButton.textContent = "No";
      noButton.addEventListener("click", async () => {
        // Handle the 'No' answer
        try {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedFilms([]);
          setMessage("Your Mention request is being processed...");

          await axios.post(
            `${apiBaseUrl}/api/mentions/mentioned`,
            {
              user_id: isAuthenticated.user.user_id,
              film_id: film.film_id,
              mentioned: false,
            },
            {
              headers: {
                Authorization: `Bearer ${isAuthenticated.token}`,
              },
            }
          );

          // Hide loading message and show table content after the user answers
          setLoading(false);
          setMessage("");
          updateDisplayedFilms();
        } catch (error) {
          console.error("Failed to update mention status:", error);
        }

        modal.remove(); // Close the modal after answering
      });

      // Append elements to the modal
      modal.appendChild(closeButton);
      modal.appendChild(mentionQuestion);
      modal.appendChild(disclaimer);
      modal.appendChild(yesButton);
      modal.appendChild(noButton);

      // Append the modal to the document body
      document.body.appendChild(modal);

      // Hide loading message and show table content after user answers
      setLoading(false);
      setMessage("");
      updateDisplayedFilms();
    } catch (error) {
      console.error("Failed to check mention status:", error);
      setLoading(false);
      setMessage("");
    }
  };

  // Helper function to highlight stars on hover
  function highlightStars(stars, rating) {
    const starElements = stars.querySelectorAll(".star");
    starElements.forEach((star, index) => {
      star.classList.toggle("highlighted", index < rating);
    });
  }

  // Helper function to remove highlights on mouseout
  function removeHighlights(stars) {
    const starElements = stars.querySelectorAll(".star");
    starElements.forEach((star) => {
      star.classList.remove("highlighted");
    });
  }

  const handleRating = async (film) => {
    // Check if the user has already rated the film
    const userRating = film.userRating;

    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/ratings/checkrating`,
        {
          params: {
            user_id: isAuthenticated.user.user_id,
            film_id: film.film_id,
          },
        }
      );

      const hasRated = response.data.rated;
      const previousUserRating = response.data.userRating;

      // Create a modal/pop-up for rating
      const modal = document.createElement("div");
      modal.className = "rating-modal";

      // Close button for the modal
      const closeButton = document.createElement("span");
      closeButton.className = "close-button";
      closeButton.textContent = "✖️";
      closeButton.addEventListener("click", () => {
        modal.remove(); // Close the modal when clicking the close button
      });

      // Rating stars
      const stars = document.createElement("div");
      stars.className = "rating-stars";

      // Create stars and handle click events
      for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        star.className = "star";
        star.dataset.value = i;

        // Highlight stars based on user's previous rating or current userRating
        if (hasRated && i <= previousUserRating) {
          star.classList.add("selected", "highlighted");
        }

        star.addEventListener("mouseover", () => {
          highlightStars(stars, i + 1); // Highlight stars up to the one being hovered over
        });

        star.addEventListener("mouseout", () => {
          removeHighlights(stars);
        });

        star.addEventListener("click", async () => {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedFilms([]);
          setMessage("Your Rating request is being processed...");

          // Handle the user's rating
          if (userRating !== i) {
            try {
              if (hasRated) {
                // User has already rated, edit the rating
                await axios.post(
                  `${apiBaseUrl}/api/ratings/edit`,
                  {
                    user_id: isAuthenticated.user.user_id,
                    film_id: film.film_id,
                    rating: i,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${isAuthenticated.token}`,
                    },
                  }
                );
              } else {
                // User has not rated, create a new rating
                await axios.post(
                  `${apiBaseUrl}/api/ratings/rate`,
                  {
                    user_id: isAuthenticated.user.user_id,
                    film_id: film.film_id,
                    rating: i,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${isAuthenticated.token}`,
                    },
                  }
                );
              }
              // Update the user's rating in the film object
              film.userRating = i;

              // If the user rates 7 or higher, open the share pop-up
              if (i >= 7) {
                openSharePopup(film);
              }

              // Hide loading message and show table content after user rates
              setLoading(false);
              setMessage("");
              updateDisplayedFilms();
            } catch (error) {
              console.error("Failed to update rating:", error);
              setLoading(false);
              setMessage("");
            }
          }

          modal.remove(); // Close the modal after rating
        });

        stars.appendChild(star);
      }

      // Append elements to the modal
      modal.appendChild(closeButton);
      modal.appendChild(stars);

      // Append the modal to the document body
      document.body.appendChild(modal);

      // Hide loading message and show table content after user rates
      setLoading(false);
      setMessage("");
      updateDisplayedFilms();
    } catch (error) {
      console.error("Failed to check rating status:", error);
      setLoading(false);
      setMessage("");
    }
  };

  const watchFilm = (film) => {
    // Check if there's a valid link in the database for this film
    if (film.watch_link) {
      // Open the film link in a new tab
      window.open(film.watch_link, "_blank");

      // Make an API request to log the click
      axios.post(
        `${apiBaseUrl}/api/watch/authclick`,
        {
          user_id: isAuthenticated.user.user_id,
          film_id: film.film_id,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );
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
      setError(
        `No film title matches your search query! Double-check you've input the
        correct title into the search field. Otherwise, consider adding the
        film to The Film List.`
      );
    } else {
      setError(false);
    }

    // Update the displayedFilms state
    setDisplayedFilms(filtered);
  };

  const renderTableHeader = () => {
    // Render table header with filter options
    return (
      <div>
        <div className="filter-options">
          <button
            onClick={() => handleFilterChange("all")}
            className={filterOption === "all" ? "active" : ""}
          >
            All Films
          </button>
          <button
            onClick={() => handleFilterChange("notRated")}
            className={filterOption === "notRated" ? "active" : ""}
          >
            Not Rated
          </button>
          <button
            onClick={() => handleFilterChange("notMentioned")}
            className={filterOption === "notMentioned" ? "active" : ""}
          >
            Not Mentioned
          </button>
          <button
            onClick={() => handleFilterChange("notHeardBefore")}
            className={filterOption === "notHeardBefore" ? "active" : ""}
          >
            Not Heard Before
          </button>
        </div>
        <input
          type="text"
          placeholder="Search Film Title"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <table>
          <thead>{renderTableHeaderRow()}</thead>
          <tbody>
            {searchQuery
              ? displayedFilms.map((film) => renderFilmRow(film))
              : Object.keys(displayedFilms).map((filmKey) =>
                  renderFilmRow(displayedFilms[filmKey])
                )}
            {displayedFilms.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="8">
                  <p className="error-message">{error}</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableHeaderRow = () => {
    // Render table sub-header row
    return (
      <tr>
        <th>Film Title</th>
        <th>Year of Release</th>
        <th>Logline</th>
        <th>Film Info</th>
        <th>Heard of Before</th>
        <th>Score Film</th>
        <th>*Watch Film</th>
        <th>Share Film</th>
      </tr>
    );
  };

  const renderFilmRow = (film) => {
    // Render film row
    return (
      <tr key={film.film_id}>
        <td>{loading || !filmsSorted ? "Loading..." : film.title}</td>
        <td>{loading || !filmsSorted ? "Loading..." : film.release_year}</td>
        <td>{loading || !filmsSorted ? "Loading..." : film.description}</td>
        <td>
          {loading || !filmsSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="info-button"
              onClick={() => openFilmDetails(film)}
            >
              Info
            </button>
          )}
        </td>
        <td>
          {loading || !filmsSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              id={`mention-button-${film.film_id}`}
              className="mention-button"
              onClick={() => handleMention(film)}
            >
              Mention
            </button>
          )}
        </td>
        <td>
          {loading || !filmsSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="rating-button"
              onClick={() => handleRating(film)}
            >
              Rate
            </button>
          )}
        </td>
        <td>
          {loading || !filmsSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <div>
              {film.watch_link ? (
                <button
                  className="watch-button"
                  onClick={() => watchFilm(film)}
                >
                  Watch Film
                </button>
              ) : (
                <button className="disabled-button">Link Not Available</button>
              )}
            </div>
          )}
        </td>
        <td>
          {loading || !filmsSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="share-button"
              onClick={() => openSharePopup(film)}
            >
              Share
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="film-list">
      <div className="custom-alert"></div>
      <p>
        *Disclaimer: The MUBI link and all available <b>Watch Film</b> buttons
        to Amazon are affiliate links. <i>Undervalued Films</i> will make a
        commission on the sale you make through the link. It is no extra cost to
        you to use the link, it's simply another way to support{" "}
        <i>Undervalued Films</i>.
      </p>
      {message && <p className="mention-rating-loading-message">{message}</p>}
      {renderTableHeader()}
    </div>
  );
}

export default FilmListLanding;
