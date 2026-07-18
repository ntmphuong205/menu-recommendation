import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./i18n/I18nContext";
import { CustomerApp } from "./pages/CustomerApp";
import { OwnerApp } from "./pages/OwnerApp";

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppProvider>
          <Routes>
            <Route path="/admin" element={<OwnerApp />} />
            <Route
              path="/"
              element={
                <div className="min-h-screen w-full flex items-center justify-center p-8">
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
