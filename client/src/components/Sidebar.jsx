
import { Users, MessageCircle } from 'lucide-react';

function Sidebar({ users, selectedUser, onSelectUser, currentUser, loading }) {
  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInHours = Math.floor((now - lastSeenDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="sidebar-content">
        <div className="loading-contacts">
          <div className="loading-text">Loading contacts...</div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="contact-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-content">
      <div className="contacts-header">
        <h4>
          <Users size={18} />
          Contacts ({users.length})
        </h4>
      </div>
      
      <div className="contacts-list">
        {users.length === 0 ? (
          <div className="no-contacts">
            <MessageCircle size={48} />
            <p>No contacts found</p>
            <span>Start by adding some friends!</span>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className={`contact-item ${selectedUser?._id === user._id ? 'active' : ''}`}
              onClick={() => onSelectUser(user)}
            >
              <div className="contact-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <span>{user.username.charAt(0).toUpperCase()}</span>
                )}
                <div className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              
              <div className="contact-info">
                <div className="contact-name">
                  <h4>{user.username}</h4>
                  <span className="contact-status">
                    {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                  </span>
                </div>
                <p className="contact-email">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;
