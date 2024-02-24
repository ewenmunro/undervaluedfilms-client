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
          here.
        </a>
      </p>
      <p>
        Support <i>Undervalued Films</i> by buying a coffee{" "}
        <a
          href="https://ewenmunro.com/coffee"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here.
        </a>
      </p>
      <p>
        Visit our shop{" "}
        <a
          href="https://www.bonfire.com/undervaluedfilms/"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here.
        </a>
      </p>{" "}
      <p>
        <i>Undervalued Films</i> values MUBI. Explore cinema with MUBI right{" "}
        <a
          href="https://mubi.com/t/web/global/l4mkmwk"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here*.
        </a>
      </p>
    </div>
  );
}

export default Promo;
