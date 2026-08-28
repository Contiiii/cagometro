import "./App.css";

import Header from "./components/header.jsx";
import Streak from "./components/Streak.jsx";
import PoopButton from "./components/PoopButton.jsx";
import UndoBotton from "./components/UndoBotton.jsx";
import BottomNav from "./components/BottomNav.jsx";

function App() {
  return (
    <div
      className="App
                  pb-24 
                  px-4 
                  text-white 
                  flex 
                  flex-col 
                  min-h-screen 
                  bg-gradient-to-b 
                  from-black 
                  via-pink-950 
                  to-black
                  min-h-screen"
    >
      <Header />

      <main
        className="
                    flex-1
                    
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-4">
        <Streak />

        <div className="flex items-center flex-col text-lg text-gray-300">
          Oggi hai fatto la cacca:
        </div>
        <div className="text-7xl md:text-8xl text-pink-400 font-black tracking-tight">
          10
        </div>

        <PoopButton />

        <UndoBotton />
      </main>

      <BottomNav />
    </div>
  );
}

export default App;
