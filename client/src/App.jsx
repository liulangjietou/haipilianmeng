import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Vote from './pages/Vote';
import PlayerDetail from './pages/PlayerDetail';
import MyVotes from './pages/MyVotes';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/my-votes" element={<MyVotes />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
