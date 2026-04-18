import "./App.css";

function Login() {
  const handleLogin = () => {
    window.location.href = "http://localhost:3001/auth/google";
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button onClick={handleLogin} className="google-btn">
          Login with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
