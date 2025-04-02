import { useEffect, useState } from "react";

const Dashboard = () => {
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        const fetchQuizzes = async () => {
            const res = await fetch("http://localhost:5000/quiz");
            const data = await res.json();
            setQuizzes(data);
        };
        fetchQuizzes();
    }, []);

    return (
        <div>
            <h2>Dashboard</h2>
            <h3>Available Quizzes</h3>
            {quizzes.map((quiz) => (
                <div key={quiz._id}>
                    <h4>{quiz.title}</h4>
                    <p>Start: {new Date(quiz.startTime).toLocaleString()}</p>
                    <p>End: {new Date(quiz.endTime).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;