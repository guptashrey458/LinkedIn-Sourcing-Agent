import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CrewAIDemo from './pages/CrewAIDemo';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<CrewAIDemo />} />
          <Route path="/demo" element={<CrewAIDemo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;