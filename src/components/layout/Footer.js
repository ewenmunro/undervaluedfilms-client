import React from "react";
import { NavLink } from "react-router-dom";
import "../../assets/styles/footer.css";

const Footer = () => {
  return (
    <footer>
      <nav>
        <ul>
          <li>
            <a
              href="https://ewenmunro.substack.com/?showWelcome=true"
              target="_blank"
              rel="noopener noreferrer"
            >
              Updates
            </a>
          </li>
          <li>
            <a
              href="https://ewenmunro.com/coffee"
              target="_blank"
              rel="noopener noreferrer"
            >
              Coffee
            </a>
          </li>
          <li>
            <a
              href="https://www.bonfire.com/undervaluedfilms/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop
            </a>
          </li>
          <li>
            <NavLink to="/terms-conditions">Terms & Conditions</NavLink>
          </li>
          <li>
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          </li>
          <li>
            <a href="mailto:undervaluedfilms@gmail.com">Contact</a>
          </li>
        </ul>
      </nav>
    </footer>
  );
};

export default Footer;
