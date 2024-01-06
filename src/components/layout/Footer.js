import React from "react";
import { NavLink } from "react-router-dom";
import "../../assets/styles/footer.css";

const Footer = () => {
  return (
    <footer>
      <nav>
        <ul>
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
