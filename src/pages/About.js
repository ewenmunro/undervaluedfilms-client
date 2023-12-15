import React from "react";
import "../assets/styles/about.css";

function About() {
  return (
    <div className="about">
      <h1>
        About <i>Undervalued Films</i>
      </h1>
      <p>
        <i>Undervalued Films</i> was founded in 2023 and is a web platform for a
        community of film enthusiasts who recommend films that they feel are
        undervalued to each other in order to give those films the appreciation
        they deserve.
      </p>
      <p>
        Users are able to recommend any film that hasn’t already been
        recommended by the community, make as many film recommendations as they
        wish, can rate whether or not they have heard of the film before coming
        to the site and can rate the quality of each film between 1 to 10 stars.
      </p>
      <p>
        All of these contributions from the community influence The Film List, a
        list of all the films recommended by the community, in order of how
        undervalued the film is. The more undervalued a film is the higher up
        the list it will land and the less undervalued a film is the lower it
        will find itself on the list.
      </p>
      <p>
        But what makes this list different is that as users seek out and watch
        the more undervalued films, the films at the top of the list, and rate
        the quality of those films on the site, those films will find their way
        down the list as they’re finally gaining more and more appreciation.
        This reshuffling of the list always gives users more undervalued films
        to seek out and watch, constantly encouraging users to discover films
        that they might not have heard of otherwise.
      </p>
    </div>
  );
}

export default About;
