import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [user, setUser] = useState({ section: "", courses: [] });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]); // Store course names
  const Studentsection = localStorage.getItem("section");
  // Fetch student details
  useEffect(() => {
    const registrationNumber = localStorage.getItem("registrationNumber");

    fetch(
      `http://localhost:5000/student/courses?registrationNumber=${registrationNumber}`
    )
      .then((res) => res.json())
      .then((data) => {
        setUser((prev) => ({ ...prev, section: data.section }));
        setEnrolledCourses(data.enrolledCourses);
      })

      .catch((err) => console.error(err));

    fetch(
      `http://localhost:5000/student/allcourses?registrationNumber=${registrationNumber}`
    )
      .then((res) => res.json())
      .then((data) => setAvailableCourses(data))
      .catch((err) => console.error(err));
  }, []);
  const refreshCourses = async () => {
    const registrationNumber = localStorage.getItem("registrationNumber");

    try {
      const [enrolledRes, availableRes] = await Promise.all([
        fetch(
          `http://localhost:5000/student/courses?registrationNumber=${registrationNumber}`
        ),
        fetch(
          `http://localhost:5000/student/allcourses?registrationNumber=${registrationNumber}`
        ),
      ]);

      const enrolledData = await enrolledRes.json();
      const availableData = await availableRes.json();
      setUser((prev) => ({ ...prev, section: enrolledData.section }));
      setEnrolledCourses(enrolledData.enrolledCourses);

      setAvailableCourses(availableData);
    } catch (err) {
      console.error("Failed to refresh courses:", err);
    }
  };

  const enrollInCourse = async (courseCode) => {
    const registrationNumber = localStorage.getItem("registrationNumber");

    await fetch("http://localhost:5000/student/update-courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber, courseCode }),
    });

    await refreshCourses(); // Refresh both lists
  };

  const UnrollFromCourse = async (courseCode) => {
    const registrationNumber = localStorage.getItem("registrationNumber");

    try {
      await fetch("http://localhost:5000/student/remove-course", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, courseCode }),
      });

      await refreshCourses(); // Refresh both lists
    } catch (error) {
      console.error("Unenroll failed:", error);
    }
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

      <p>Section: {user.section || Studentsection || "Not assigned yet"}</p>

      <h3>Enrolled Courses:</h3>
      <ul>
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <li key={course._id}>
              {course.courseName ? course.courseName : "Unnamed Course"}(
              {course.courseCode ? course.courseCode : "No Code"})
              <button onClick={() => UnrollFromCourse(course.courseCode)}>
                Unenroll
              </button>
            </li>
          ))
        ) : (
          <p>Not enrolled in any courses.</p>
        )}
      </ul>

      <h3>Available Courses:</h3>
      <ul>
        {availableCourses.length > 0 ? (
          availableCourses.map((course) => (
            <li key={course._id}>
              {course.courseName ? course.courseName : "Unnamed Course"}(
              {course.courseCode ? course.courseCode : "No Code"})
              <button onClick={() => enrollInCourse(course.courseCode)}>
                Enroll
              </button>
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
