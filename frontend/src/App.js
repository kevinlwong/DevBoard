import React, { useEffect, useState } from "react";
import Todos from "./components/Todos";

function App() {
  const [apiStatus, setApiStatus] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("API not reachable!"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <Todos></Todos>
      <p>
        Backend API Status: <strong>{apiStatus}</strong>
      </p>
    </div>
  );
}

export default App;
