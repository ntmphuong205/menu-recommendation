import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./i18n/I18nContext";
import { CustomerApp } from "./pages/CustomerApp";
import { OwnerApp } from "./pages/OwnerApp";
import { PickupResultScreen } from "./screens/PickupResultScreen";

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppProvider>
          <Routes>
            <Route path="/admin" element={<OwnerApp />} />
            {/* VNPay's vnp_ReturnUrl target — full-width on purpose, not
                wrapped in the phone-mockup frame CustomerApp uses. */}
            <Route path="/pickup-result" element={<PickupResultScreen />} />
            <Route
              path="/"
              element={
                <div className="min-h-screen w-full flex items-center justify-center md:p-8">
                  <CustomerApp />
                </div>
              }
            />
          </Routes>
        </AppProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
