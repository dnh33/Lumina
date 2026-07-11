import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Shell } from "./components/Shell";
import { ChatDock } from "./components/chat/ChatDock";
import Discover from "./pages/Discover";
import Library from "./pages/Library";
import TitleDetail from "./pages/TitleDetail";
import PersonPage from "./pages/PersonPage";
import ChatPage from "./pages/ChatPage";
import Settings from "./pages/Settings";

export default function App() {
  const location = useLocation();
  const onChatPage = location.pathname.startsWith("/chat");

  return (
    <Shell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-full"
        >
          <Routes location={location}>
            <Route path="/" element={<Discover />} />
            <Route path="/library" element={<Library />} />
            <Route path="/title/:type/:tmdbId" element={<TitleDetail />} />
            <Route path="/person/:id" element={<PersonPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Discover />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!onChatPage && <ChatDock />}
    </Shell>
  );
}
