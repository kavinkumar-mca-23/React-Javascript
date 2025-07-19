
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import ChatContainer from './components/ChatContainer';
import './App.css';

const BACKEND_URL = 'https://react-javascript-backend.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
        
        // Initialize socket connection
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);
        
        return () => newSocket.close();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // Initialize socket connection
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  if (user && socket) {
    return <ChatContainer user={user} socket={socket} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-header">
          <h1>WhatsApp Clone</h1>
        </div>
        {isLogin ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Register onRegister={handleLogin} />
        )}
        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="link-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
