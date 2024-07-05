import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/filmdetailsprivate.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const FilmDetailsPrivate = () => {
  const { filmDetails } = useParams();
  const [film, setFilm] = useState(null);
  const [isMentioned, setIsMentioned] = useState(false);

  const { isAuthenticated } = useAuth();

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

        // Check if the user has mentioned the film
        const mentionResponse = await axios.get(
          `${apiBaseUrl}/api/mentions/checkmentioned`,
          {
            params: {
              user_id: isAuthenticated.user.user_id,
              film_id: response.data.film.film_id,
            },
          }
        );

        setIsMentioned(mentionResponse.data.hasMentioned);
      } catch (error) {
        console.error("Failed to fetch film details:", error);
      }
    };

    fetchFilmDetails();
  }, [filmDetails, isAuthenticated.user.user_id]);

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

  const handleMention = async (mentioned) => {
    try {
      // Make an API request to update the mention status
      await axios.post(
        `${apiBaseUrl}/api/mentions/mentioned`,
        {
          user_id: isAuthenticated.user.user_id,
          film_id: film.film_id,
          mentioned,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );

      // Update the state to reflect the mention status
      setIsMentioned(mentioned);
    } catch (error) {
      console.error("Failed to update mention status:", error);
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
            } catch (error) {
              console.error("Failed to update rating:", error);
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
    } catch (error) {
      console.error("Failed to check rating status:", error);
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

  const shareViaEmail = () => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const subject = encodeURIComponent(`Check out this film: ${film.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this film: undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = () => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = () => {
    const titleWithHyphens = film.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this film: ${film.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      `undervaluedfilms.com/films/${titleWithHyphens}-${film.release_year}`
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
      <p>
        <b>Heard of Before:</b>
      </p>
      <p>
        Have you heard of {film.title} before visiting undervaluedfilms.com?
      </p>
      <p>
        Note: Once you have answered the question, you won't be able to edit
        your answer. Please make sure you answer this question correctly.
      </p>
      <p>
        {isMentioned ? (
          <button className="film-details-disable" disabled>
            Mentioned
          </button>
        ) : (
          <>
            <button
              className="film-details-mention-button"
              onClick={() => handleMention(true)}
            >
              Yes
            </button>
            <button
              className="film-details-mention-button"
              onClick={() => handleMention(false)}
            >
              No
            </button>
          </>
        )}
      </p>
      <p>
        <b>Score Film:</b>
      </p>
      <p>
        <button
          className="film-details-rating-button"
          onClick={() => handleRating(film)}
        >
          Rate
        </button>
      </p>
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
        <button className="film-details-disable" disabled>
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

export default FilmDetailsPrivate;
