import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";


const StudentDashboard = () => {

    const [user, setUser] = useState({ section: "", courses: [] });
    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]); // Store course names
    // Fetch student details
    useEffect(() => {
        fetch("http://localhost:5000/students/me")
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(err => console.error(err));

        fetch("http://localhost:5000/courses") // Fetch available courses
            .then(res => res.json())
            .then(data => setAvailableCourses(data))
            .catch(err => console.error(err));
    }, []);

    // Function to enroll in a course
    const enrollInCourse = async (courseId) => {
        const updatedCourses = [...user.courses, courseId];

        await fetch("http://localhost:5000/student/update-courses", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courses: updatedCourses }),
        });

        setUser({ ...user, courses: updatedCourses });
    };
    return (
        <div className="dashboard-container">
    <div className="nav-buttons">
        <Link to="/StudentDash">
            <button>Dashboard</button>
        </Link>
        <Link to="/StudentQuiz">
            <button>Quiz</button>
        </Link>
    </div>

    <h2>Edit Profile</h2>
    <p>Section: {user.section || "Not assigned yet"}</p>

    <h3>Enrolled Courses:</h3>
    <ul>
    {enrolledCourses.length > 0 ? (
                    enrolledCourses.map(course => <li key={course._id}>{course.name}</li>)
                ) : (
                    <p>Not enrolled in any courses.</p>
                )}
    </ul>

    <h3>Available Courses:</h3>
<ul>
{availableCourses.length > 0 ? (
        availableCourses.map((course) => (
            <li key={course._id}>
                {course.courseName ? course.courseName : "Unnamed Course"}  
                 ({course.courseCode ? course.courseCode : "No Code"}) 
                <button onClick={() => enrollInCourse(course._id)}>Enroll</button>
            </li>
        ))
    ) : (
        <p>No courses available.</p>
    )}
</ul>
</div>

    );
};

export default StudentDashboard;
