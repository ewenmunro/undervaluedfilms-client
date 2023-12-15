// routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";

//  components/pages
import Home from "../../pages/Home";
import About from "../../pages/About";
import Landing from "../../pages/Landing";
import AddFilm from "../../pages/AddFilm";
import UserProfile from "../../pages/UserProfile";
import Login from "../../pages/Login";
import Signup from "../../pages/Signup";

// components auth
import Logout from "../auth/Logout";
import Verification from "../../pages/Verification";

// components/route
import PrivateRoutes from "./PrivateRoutes";

const AllRoutes = () => (
  <Routes>
    <Route exact path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route element={<PrivateRoutes />}>
      <Route exact path="/dashboard" element={<Landing />} />
      <Route path="/addfilm" element={<AddFilm />} />
      <Route path="/myprofile" element={<UserProfile />} />
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/verification/:token" element={<Verification />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/logout" element={<Logout />} />
  </Routes>
);

export default AllRoutes;
