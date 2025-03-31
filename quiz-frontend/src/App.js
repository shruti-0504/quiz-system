import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";

function App() {
    return (
        <Router>  {/* ✅ Use "Router" instead of "BrowserRouter" */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
        
    );
}

export default App;