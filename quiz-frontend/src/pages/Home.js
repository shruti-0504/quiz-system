import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css"
const Home = () => {
     const [isLogin, setIsLogin] = useState(true); // Toggle between login & register
        const [name, setName] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [cpassword, setcPassword] = useState("");
        const [role, setRole] = useState("student");
        const [otp, setOtp] = useState("");
        const [step, setStep] = useState(1); // Step 1: Register | Step 2: Verify OTP
        const [otpExpiry, setOtpExpiry] = useState(60); // Set expiry time (in seconds)
const [isOtpExpired, setIsOtpExpired] = useState(false);

        const navigate = useNavigate();
        const handleLogin = async () => {
            try {
                const res = await fetch("http://localhost:5000/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
    
                const data = await res.json();

        if (res.ok && data.role) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);

            setTimeout(() => {
                const storedRole = localStorage.getItem("role");

                if (storedRole === "teacher") {
                    console.log("Navigating to Teacher Dashboard...");
                    navigate("/teacherDash", { replace: true });
                } else if (storedRole === "student") {
                    console.log("Navigating to Student Dashboard...");
                    window.location.href = "/studentDash"; 
                } else {
                    alert("Invalid role!"); 
                }
            }, 200);
        
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert("Error logging in!");
            }
        };
        const startOtpCountdown = () => {
            let timeLeft = 60; // Initial time (change if needed)
            const timer = setInterval(() => {
                timeLeft -= 1;
                setOtpExpiry(timeLeft);
        
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    setIsOtpExpired(true); // Mark OTP as expired
                }
            }, 1000);
        };
        
    
        // Step 1: Send OTP
        const sendOtp = async () => {
            if (password !== cpassword) {
                alert("Passwords do not match!");
                return;
            }
            try {
                const res = await fetch("http://localhost:5000/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
    
                const data = await res.json();
                if (res.ok) {
                    alert("OTP sent successfully!");
                    setStep(2); // Move to OTP verification step
                    setOtpExpiry(60); // Reset timer to 30 seconds
                    setIsOtpExpired(false); // Reset expiration state
                    startOtpCountdown(); // Start countdown
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (err) {
                console.error("Error sending OTP:", err);
                alert("Error sending OTP. Check console.");
            }
        };
    
        // Step 2: Verify OTP and Register
        const verifyOtpAndRegister = async () => {
            try {
                const res = await fetch("http://localhost:5000/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp, name, password, role }),
                });
    
                const data = await res.json();
                if (res.ok) {
                    alert("Registration successful!");
                    navigate("/login");
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (err) {
                console.error("Error verifying OTP:", err);
                alert("Error verifying OTP. Check console.");
            }
        };
    return (
        <div>
            <h1>Welcome to the Quiz Portal</h1>
            <div className="auth-container">
            {/* Tabs to switch between Login & Register */}
            <div className="tabs">
                <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>Login</button>
                <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>Register</button>
            </div>

            {/* Login Form */}
            {isLogin ? (
                <div className="login-form">
                    <h2>Login</h2>
                    <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={handleLogin}>Login</button>
                </div>
            ) : (
                // Register Form with OTP Verification
                <div className="register-form">
                    
                    {step === 1 ? (
                        <>
                            <h2>Register</h2>
                            <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
                            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
                            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                            <input type="password" placeholder="Confirm Password" onChange={(e) => setcPassword(e.target.value)} />
                            <select onChange={(e) => setRole(e.target.value)}>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                            <button onClick={sendOtp}>Send OTP</button>
                        </>
                    ) : (
                        <>
                            <h2>Email sent to {email}</h2>

                            {isOtpExpired ? (
                                <h3 className="otp-expired">OTP Expired</h3>
                            ) : (
                                <h3>OTP expires in {otpExpiry} seconds</h3>
                            )}

                            <input type="text" placeholder="Enter OTP" onChange={(e) => setOtp(e.target.value)} />

                            {isOtpExpired ? (
                                <button onClick={sendOtp}>Resend OTP</button>  // Resend OTP
                            ) : (
                                <button onClick={verifyOtpAndRegister}>Register</button>  // Register
                            )}

                        </>
                    )}
                </div>
            )}
        </div>
        </div>
    );
};

export default Home;
