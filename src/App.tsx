import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./i18n/I18nContext";
import { CustomerApp } from "./pages/CustomerApp";
import { OwnerApp } from "./pages/OwnerApp";
import { StoreDirectory } from "./pages/StoreDirectory";
import { PickupResultScreen } from "./screens/PickupResultScreen";
import { getStoreSlug } from "./lib/storeSlug";

/** Every QR code this product prints already bakes in ?store=<slug> (see
 *  TableQrView.tsx) — so landing on "/" with no slug at all only happens
 *  when someone types the bare domain directly. Show the restaurant
 *  directory then, instead of silently falling back to a single default
 *  store the way the backend's own X-Store-Slug resolution does. */
function RootRoute() {
  if (!getStoreSlug()) return <StoreDirectory />;
  return (
    <div className="min-h-screen w-full flex items-center justify-center md:p-8">
      <CustomerApp />
    </div>
  );
}

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
            <Route path="/" element={<RootRoute />} />
          </Routes>
        </AppProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
