import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PhoneFrame } from "../components/PhoneFrame";
import { TabBar } from "../components/TabBar";
import { DishSheet } from "../components/DishSheet";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { CartScreen } from "../screens/CartScreen";
import { InfoScreen } from "../screens/InfoScreen";

function Screens() {
  const { activeTab } = useApp();
  return (
    <div className="flex-1 min-h-0 relative">
      {activeTab === "chat" && <ChatScreen />}
      {activeTab === "menu" && <MenuScreen />}
      {activeTab === "cart" && <CartScreen />}
      {activeTab === "info" && <InfoScreen />}
      <DishSheet />
    </div>
  );
}

export function CustomerApp() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <PhoneFrame>
      <div className="relative flex-1 min-h-0 flex flex-col">
        <Screens />
        <TabBar />
        {showWelcome && <WelcomeScreen onStart={() => setShowWelcome(false)} />}
      </div>
    </PhoneFrame>
  );
}
