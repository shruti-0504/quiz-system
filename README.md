# 🧠 Quiz Portal – Teacher & Student Platform

A full-stack web application that enables teachers to create, manage, and monitor quizzes securely while allowing students to register, view, and attempt quizzes in a time-bound and password-protected environment.

link: https://quiz-system-psi.vercel.app/

---

## 🚀 Features

### 👩‍🏫 Teacher Features
- **OTP-based Login & Registration**
- **Create and Allot Quizzes**
  - Set start/end times for quiz and registration
  - Add duration and section via dropdown
  - Password-protected access
- **Edit Quiz Details**
  - Update title, section, timings, questions
- **Manage Sections**
  - Assign sections to ungrouped students
- **Approve Students**
  - Approve/reject/pending statuses
- **View Results**
  - View submitted responses and scores

### 👨‍🎓 Student Features
- **OTP-based Login & Registration**
- **Enroll in Courses**
  - Select from available backend-fetched courses
- **View Available Quizzes**
  - Register if within deadline
  - Attempt if approved and time is valid
- **Quiz Attempt**
  - Password verification
  - Time-limited with auto-submit
  - Tab switch detection (max 3)
  - Navigation restrictions with color-coded panel

---

## 🧱 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: OTP System


---

## 🛡️ Security Highlights

- Password entry required before quiz start
- Tab-switch auto-submission (anti-cheat)
- No re-attempt after submission
- Future support for webcam-based proctoring

---

## 📊 Future Enhancements

- AI-based cheating detection using webcam
- Auto-generated quiz access PIN
- Student quiz result visibility and analytics
- Performance dashboard for teachers

---

## 📁 Project Structure

├── client/ # React frontend ├── server/ # Node.js backend ├── models/ # MongoDB schemas ├── routes/ # Express API routes ├── controllers/ # Logic layer ├── middleware/ # Auth & validation ├── .env # Environment variables └── README.md


## 🛠️ Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/yourusername/quiz-portal.git
cd quiz-portal
Install dependencies

npm install     # for backend
cd client && npm install   # for frontend
Configure environment variables in .env

Start the servers

npm start       # backend
cd client && npm start   # frontend
📬 Feedback & Contributions
Feel free to submit issues or feature requests. Contributions are welcome via pull requests.
For major changes, please open an issue first to discuss what you would like to change.

 

