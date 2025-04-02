import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // Step 1: Register | Step 2: Verify OTP
    const navigate = useNavigate();

    // Step 1: Send OTP
    const sendOtp = async () => {
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
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Error sending OTP:", err);
            alert("Error sending OTP. Check console.");
        }
    };

    // Step 2: Verify OTP and Register User
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
            <h2>Register</h2>
            {step === 1 ? (
                <>
                    <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    <select onChange={(e) => setRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                    <button onClick={sendOtp}>Send OTP</button>
                </>
            ) : (
                <>
                    <h3>Enter OTP</h3>
                    <input type="text" placeholder="Enter OTP" onChange={(e) => setOtp(e.target.value)} />
                    <button onClick={verifyOtpAndRegister}>Verify OTP & Register</button>
                </>
            )}
        </div>
    );
};

export default Register;
