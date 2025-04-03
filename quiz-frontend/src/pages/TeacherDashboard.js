import React, { useState, useEffect } from "react";
import axios from "axios";

const TeacherDashboard = () => {
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        const fetchQuizzes = async () => {
            const res = await axios.get("http://localhost:5000/quiz/teacher");
            setQuizzes(res.data);
        };
        fetchQuizzes();
    }, []);

    return (
        <div>
            <h2>Teacher Dashboard</h2>
            <button>Create New Quiz</button>
            <ul>
                {quizzes.map((quiz) => (
                    <li key={quiz._id}>
                        {quiz.title} - <button>View</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TeacherDashboard;