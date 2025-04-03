import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentDashboard = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [password, setPassword] = useState("");

    useEffect(() => {
        const fetchQuizzes = async () => {
            const res = await axios.get("http://localhost:5000/quiz/student");
            setQuizzes(res.data);
        };
        fetchQuizzes();
    }, []);

    const joinQuiz = async (quizId) => {
        try {
            const res = await axios.post("http://localhost:5000/quiz/join", { quizId, password });
            alert(res.data.message);
        } catch (error) {
            alert("Incorrect password or error joining quiz.");
        }
    };

    return (
        <div>
            <h2>Student Dashboard</h2>
            <ul>
                {quizzes.map((quiz) => (
                    <li key={quiz._id}>
                        {quiz.title} - 
                        <input 
                            type="password" 
                            placeholder="Enter Quiz Password" 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <button onClick={() => joinQuiz(quiz._id)}>Join Quiz</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentDashboard;
