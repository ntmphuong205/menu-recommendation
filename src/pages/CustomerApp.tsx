import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PhoneFrame } from "../components/PhoneFrame";
import { TabBar } from "../components/TabBar";
import { DishSheet } from "../components/DishSheet";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { DiningChoiceScreen } from "../components/DiningChoiceScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { StaffChatScreen } from "../screens/StaffChatScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { CartScreen } from "../screens/CartScreen";
import { InfoScreen } from "../screens/InfoScreen";
import { ReserveScreen } from "../screens/ReserveScreen";
import { RESERVATIONS_ENABLED } from "../data/featureFlags";

function Screens() {
  const { activeTab } = useApp();
  return (
    <div className="flex-1 min-h-0 relative">
      {activeTab === "chat" && <ChatScreen />}
      {activeTab === "staff_chat" && <StaffChatScreen />}
      {activeTab === "menu" && <MenuScreen />}
      {activeTab === "cart" && <CartScreen />}
      {activeTab === "info" && <InfoScreen />}
      {RESERVATIONS_ENABLED && activeTab === "reserve" && <ReserveScreen />}
      <DishSheet />
    </div>
  );
}

export function CustomerApp() {
  const { mode, webOrderIntent, setWebOrderIntent, setActiveTab } = useApp();
  const [showWelcome, setShowWelcome] = useState(true);

  const handleChoice = (choice: "dine_in" | "pickup") => {
    if (choice === "pickup") setActiveTab("menu");
    setWebOrderIntent(choice);
  };

  return (
    <PhoneFrame>
      <div className="relative flex-1 min-h-0 flex flex-col">
        <Screens />
        <TabBar />
        {!showWelcome && mode === "web" && webOrderIntent === null && <DiningChoiceScreen onChoose={handleChoice} />}
        {showWelcome && <WelcomeScreen onStart={() => setShowWelcome(false)} />}
      </div>
    </PhoneFrame>
  );
}
