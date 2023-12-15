import React from "react";
import "../../assets/styles/promo.css";

function Promo() {
  return (
    <div className="promo">
      <p>
        Subscribe to Updates to receive the latest <i>Undervalued Films</i>{" "}
        updates, and more, right{" "}
        <a
          href="https://ewenmunro.substack.com/?showWelcome=true"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here
        </a>
        .
      </p>
    </div>
  );
}

export default Promo;
