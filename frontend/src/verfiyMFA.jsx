import { useState } from "react";

function VerifyMFA({ onVerified }) {
  const [code, setCode] = useState("");
  const userId = new URLSearchParams(window.location.search).get("userId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3001/auth/verify-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code }),
    });

    if (res.ok) {
      const data = await res.json();
      onVerified(data.user); // Pass the user back to App.jsx
    } else {
      alert("Invalid or expired code. Please check your console/email.");
    }
  };

  return (
    <div className="login-card">
      <h2>Two-Step Verification</h2>
      <p>Enter the 6-digit code sent to your email (Check Backend Console).</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength="6"
          placeholder="000000"
          className="mfa-input"
        />
        <br></br>
        <br></br>
        <button type="submit" className="login-btn">
          Verify Identity
        </button>
      </form>
    </div>
  );
}

export default VerifyMFA;
