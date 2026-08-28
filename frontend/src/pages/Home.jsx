import Header from "../components/Header.jsx";
import Streak from "../components/Streak.jsx";
import PoopButton from "../components/PoopButton.jsx";
import UndoBotton from "../components/UndoBotton.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useState, useEffect } from "react";

function App() {
  const today = new Date().toISOString().split("T")[0];
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("entries");
    return savedEntries ? JSON.parse(savedEntries) : {};
  });

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  const todayCount = entries[today] || 0;


  function calculateStreak(){
    let streak = 0;
    const currentDate = new Date();

    while(true){
        const dateString = currentDate.toISOString().split("T")[0];
        if ((entries[dateString] || 0 ) > 0){
            ++streak;
            currentDate.setDate(currentDate.getDate() - 1);
        }else{
            break;
        }
    }
    return streak;
  }
  const streak = calculateStreak();

  return (
    <div
      className="App
                  pb-24 
                  px-4 
                  text-white 
                  flex 
                  flex-col 
                  bg-gradient-to-b 
                  bg-black
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
                    gap-4"
      >
        <Streak streak = {streak}/>

        <div className="flex items-center flex-col text-lg text-gray-300">
          Oggi hai fatto la cacca:
        </div>
        <div className="text-7xl md:text-8xl text-pink-400 font-bold tracking-tight">
          {todayCount}
        </div>

        <PoopButton
          onClick={() =>
            setEntries({
              ...entries,
              [today]: todayCount + 1,
            })
          }
        />

        <UndoBotton
          onClick={() => {
            if (todayCount > 0) {
              setEntries({
                ...entries,
                [today]: todayCount - 1,
              });
            }
          }}
        />
      </main>

      <BottomNav />
    </div>
  );
}

export default App;
