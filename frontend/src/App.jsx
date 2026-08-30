import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Report from "./pages/Report";
import Achievements from "./pages/Achievements";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid rgba(244,114,182,.2)",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Achievements" element={<Achievements />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}