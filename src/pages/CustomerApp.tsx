import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PhoneFrame } from "../components/PhoneFrame";
import { TabBar } from "../components/TabBar";
import { DishSheet } from "../components/DishSheet";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { DiningChoiceScreen } from "../components/DiningChoiceScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { CartScreen } from "../screens/CartScreen";
import { InfoScreen } from "../screens/InfoScreen";
import { ReserveScreen } from "../screens/ReserveScreen";

function Screens() {
  const { activeTab } = useApp();
  return (
    <div className="flex-1 min-h-0 relative">
      {activeTab === "chat" && <ChatScreen />}
      {activeTab === "menu" && <MenuScreen />}
      {activeTab === "cart" && <CartScreen />}
      {activeTab === "info" && <InfoScreen />}
      {activeTab === "reserve" && <ReserveScreen />}
      <DishSheet />
    </div>
  );
}

export function CustomerApp() {
  const { mode, setActiveTab } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);
  // Only meaningful in mode=web — mode=store (a real table QR scan) skips
  // straight past this, since dine-in there is already a given.
  const [choiceMade, setChoiceMade] = useState(false);

  const handleChoice = (choice: "dine_in" | "pickup") => {
    if (choice === "pickup") setActiveTab("menu");
    setChoiceMade(true);
  };

  return (
    <PhoneFrame>
      <div className="relative flex-1 min-h-0 flex flex-col">
        <Screens />
        <TabBar />
        {!showWelcome && mode === "web" && !choiceMade && <DiningChoiceScreen onChoose={handleChoice} />}
        {showWelcome && <WelcomeScreen onStart={() => setShowWelcome(false)} />}
      </div>
    </PhoneFrame>
  );
}
