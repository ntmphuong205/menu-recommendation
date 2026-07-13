import { AppProvider, useApp } from "./context/AppContext";
import { PhoneFrame } from "./components/PhoneFrame";
import { TabBar } from "./components/TabBar";
import { DishSheet } from "./components/DishSheet";
import { ChatScreen } from "./screens/ChatScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { CartScreen } from "./screens/CartScreen";
import { InfoScreen } from "./screens/InfoScreen";

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

function App() {
  return (
    <AppProvider>
      <PhoneFrame>
        <Screens />
        <TabBar />
      </PhoneFrame>
    </AppProvider>
  );
}

export default App;
