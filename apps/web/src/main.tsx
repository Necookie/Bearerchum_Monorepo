import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Review from "./pages/Review";
import Practice from "./pages/Practice";
import Problem from "./pages/Problem";
import { GuidePage, LearnIndex, TechniquesPage } from "./pages/Learn";
import Team from "./pages/Team";
import Account from "./pages/Account";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/workspace.css";

function ContentGate({ children }: { children: React.ReactNode }) {
  const { contentError } = useStore();
  if (contentError) return <div className="container empty"><h2>Couldn't load the study content</h2><p>{contentError}</p></div>;
  return <>{children}</>;
}

function NotFound() {
  return <div className="container empty"><h2>Page not found</h2><p>That address does not match any page.</p><Link to="/">Go to Today</Link></div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <ContentGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="review" element={<Review />} />
              <Route path="practice" element={<Practice />} />
              <Route path="practice/:id" element={<Problem />} />
              <Route path="learn" element={<LearnIndex />} />
              <Route path="learn/techniques" element={<TechniquesPage />} />
              <Route path="learn/:section" element={<GuidePage />} />
              <Route path="team" element={<Team />} />
              <Route path="account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ContentGate>
      </BrowserRouter>
    </StoreProvider>
  </React.StrictMode>,
);
