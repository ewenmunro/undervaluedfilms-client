import React, { useState } from "react";
import axios from "axios";

// assets/styles
import "../../assets/styles/addfilmform.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function AddFilm({ onAddFilm }) {
  const { isAuthenticated } = useAuth();

  // Variable to quickly disable Add Film button if I need to
  let isButtonDisabled = false;

  // State to store user input
  const [formData, setFormData] = useState({
    title: "",
    year: "",
    description: "",
  });

  // State to store success and error messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Extract film details from formData
    const { title, year, description, confirmationChecked } = formData;

    // // Disable the Add Film button when I need to
    // setIsButtonDisabled(true);

    // Clear previous success and error messages
    setSuccessMessage("");
    setErrorMessage("");

    // Check if the confirmation checkbox is checked
    if (!confirmationChecked) {
      setErrorMessage(
        "Please confirm that you've double-checked the film details."
      );
      return;
    }

    // Validate the form data
    if (!title.trim() || !year.trim() || !description.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    // Validate the year format (should be a number)
    if (isNaN(year)) {
      setErrorMessage("Year of release must be a number.");
      return;
    }

    // Validate that the title is not a website link
    if (containsWebsiteLinks(title)) {
      setErrorMessage("Title should not be a website link.");
      return;
    }

    // Validate that the year is not a website link
    if (containsWebsiteLinks(year)) {
      setErrorMessage("Release year should not be a website link.");
      return;
    }

    // Validate that the description does not contain website links
    if (containsWebsiteLinks(description)) {
      setErrorMessage("Description should not contain website links.");
      return;
    }

    // Validate that the title do not contain accents
    if (containsAccents(title)) {
      setErrorMessage("Title should not contain accents.");
      return;
    }

    // Validate that the title and description do not contain accents
    if (containsAccents(description)) {
      setErrorMessage("Description should not contain accents.");
      return;
    }

    // Check if a film with the same title and year already exists in the database
    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/films/checkfilm?title=${title}&release_year=${year}`
      );

      if (response.data.exists) {
        setErrorMessage("This film is already on The Film List.");
        return;
      }
    } catch (error) {
      console.error("Error checking film:", error);
      setErrorMessage("Failed to check if the film exists. Please try again.");
      return;
    }

    // If no matching film was found, proceed to add the film
    try {
      // Make an Axios POST request to your backend API to add a film
      const response = await axios.post(
        `${apiBaseUrl}/api/films/addfilm`,
        {
          title,
          release_year: year,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );

      if (response.status === 201) {
        // Clear the form data
        setFormData({ title: "", year: "", description: "" });

        // Clear previous error messages
        setErrorMessage("");

        // Display a success message if the film was added successfully
        setSuccessMessage("Film added to The Film List");

        // Call the onAddFilm function passed as a prop to update the film list
        onAddFilm(response.data.film);
      } else {
        // Handle other response statuses, if needed
        setErrorMessage("Failed to add the film. Please try again.");
      }
    } catch (error) {
      // Handle any errors that occur during the request
      console.error("Failed to add the film:", error);
      setErrorMessage("Failed to add the film. Please try again.");
    }
  };

  // Function to check if a string contains website links using regular expressions
  const containsWebsiteLinks = (text) => {
    // Regular expression to match URLs
    const urlPattern = /(https?|ftp|http):\/\/[^\s/$.?#].[^\s]*/gi;

    // Test if the text contains URLs
    return urlPattern.test(text);
  };

  // Function to check if a string contains accents
  const containsAccents = (text) => {
    // Regular expression to match accents
    const accentPattern = /[\u0300-\u036f]/g;

    // Test if the text contains accents
    return accentPattern.test(text);
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    if (type === "checkbox") {
      // If the input is a checkbox, update the confirmationChecked state
      formattedValue = checked;
    } else if (name === "title") {
      // If the input is for the title, capitalize the first letter of each word and convert the rest to lowercase
      formattedValue = value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Update the formData state with the formatted input value
    setFormData({ ...formData, [name]: formattedValue });
  };

  return (
    <div className="add-film-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" />
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="year" />
          <input
            type="text"
            id="year"
            name="year"
            placeholder="Year of Release"
            value={formData.year}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="description" />
          <textarea
            id="description"
            name="description"
            placeholder="Logline"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <input
            type="checkbox"
            id="confirmation"
            name="confirmationChecked"
            checked={formData.confirmationChecked}
            onChange={handleInputChange}
          />
          <label htmlFor="confirmation">
            I confirm that I've double-checked the film details
          </label>
        </div>
        <div>
          <button
            type="submit"
            className="add-film-button"
            disabled={isButtonDisabled}
          >
            Add Film
          </button>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );
}

export default AddFilm;
