import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

// components/routes
import AllRoutes from "./components/routes/Route";

// components/layout
import Header from "./components/layout/Header";

// component/auth
import { AuthProvider } from "./components/auth/AuthContext";
import usePageLoading from "./components/auth/Loading";

import "./assets/styles/loading.css";

function App() {
  const isLoading = usePageLoading();

  return (
    <AuthProvider>
      <Router>
        <header>
          <Header />
        </header>
        <main>
          {isLoading ? (
            <p className="loading-message">Refreshing page...</p>
          ) : (
            <AllRoutes />
          )}
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
