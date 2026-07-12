import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { initSound } from "./lib/sound";
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

  useEffect(() => {
    initSound();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
      <AnimatePresence mode="wait">
        {/* Stable key across /chat and /chat/:id so the first-send navigate
            re-renders ChatPage (param change) instead of remounting it — a
            remount would fire useChat's cleanup and abort the in-flight stream. */}
        <motion.div
          key={location.pathname.startsWith("/chat") ? "chat" : location.pathname}
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
            {/* Single splat route: navigating /chat → /chat/:id only changes the
                param (re-render), never remounts ChatPage. Prevents the
                first-send race where the remount aborted the in-flight stream. */}
            <Route path="/chat/*" element={<ChatPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Discover />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!onChatPage && <ChatDock />}
    </Shell>
    </MotionConfig>
  );
}
