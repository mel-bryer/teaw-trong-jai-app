// Screens: the map is always underneath; the quiz, a place, the profile, the feed, events, the owner portal and the admin queue open over it as their own routes.
import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MapScreen } from './screens/MapScreen';
import { Quiz } from './screens/Quiz';
import { Place } from './screens/Place';
import { Profile } from './screens/Profile';
import { Feed } from './screens/Feed';
import { Events, useReminders } from './screens/Events';
import { Biz } from './screens/Biz';
import { Admin } from './screens/Admin';
import { useProfile, personaOf } from './lib/profile';
import { useUI } from './lib/ui';

function FirstVisit() {
  const nav = useNavigate(), loc = useLocation();
  useReminders();
  useEffect(() => {
    const p = useProfile.getState().profile;
    if (!p && loc.pathname === '/') nav('/quiz', { replace: true });
    else if (p && loc.pathname === '/') { const per = personaOf(p); if (per) setTimeout(() => { useUI.getState().send({ kind: 'zone', id: per.zone }); useUI.getState().say(`กลับมาแล้ว vibe ${per.name} ยังอยู่ครบ`); }, 1200); }
  }, []); // eslint-disable-line
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <FirstVisit />
      <MapScreen />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/place/:id" element={<Place />} />
        <Route path="/me" element={<Profile />} />
        <Route path="/foryou" element={<Feed />} />
        <Route path="/events" element={<Events />} />
        <Route path="/biz" element={<Biz />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={null} />
      </Routes>
    </HashRouter>
  );
}
