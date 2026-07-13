import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { CustomerApp } from "./pages/CustomerApp";
import { OwnerApp } from "./pages/OwnerApp";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
