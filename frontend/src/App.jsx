import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Report from "./pages/Report";
import Achievements from "./pages/Achievements";



function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/Achievements" element={<Achievements/>} />
          <Route path="/report" element={<Report/>} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
