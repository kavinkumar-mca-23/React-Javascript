
import { useState, useEffect } from 'react';
import { LogOut, Settings, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import axios from 'axios';

const BACKEND_URL = 'https://react-javascript-backend.onrender.com';

function ChatContainer({ user, socket, onLogout }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join', user.id);
      fetchUsers();
    }
  }, [socket, user]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    onLogout();
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span>{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-details">
              <h3>{user.username}</h3>
              <span className="online-status">Online</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Settings">
              <Settings size={20} />
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="search-container">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Sidebar 
          users={filteredUsers}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          currentUser={user}
          loading={loading}
        />
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <ChatArea
            currentUser={user}
            selectedUser={selectedUser}
            socket={socket}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h2>Welcome to WhatsApp Clone</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatContainer;
