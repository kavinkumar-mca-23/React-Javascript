import { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Edit, Trash2, CornerUpRight, Share } from 'lucide-react';
import MessageInput from './MessageInput';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';

function ChatArea({ currentUser, selectedUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      setLoading(true);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', handleNewMessage);
      socket.on('messageEdited', handleEditMessage);
      socket.on('messageDeleted', handleDeleteMessage);
      socket.on('userTyping', handleTyping);
      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('messageEdited', handleEditMessage);
        socket.off('messageDeleted', handleDeleteMessage);
        socket.off('userTyping', handleTyping);
      };
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BACKEND_URL}/api/messages/${selectedUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (
      (message.sender._id === currentUser.id && message.receiver._id === selectedUser._id) ||
      (message.sender._id === selectedUser._id && message.receiver._id === currentUser.id)
    ) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleEditMessage = (editedMessage) => {
    setMessages(prev =>
      prev.map(msg => (msg._id === editedMessage._id ? editedMessage : msg))
    );
  };

const handleDeleteMessage = ({ messageId }) => {
  setMessages(prev => prev.filter(msg => msg._id !== msgId));
};


  const handleTyping = (data) => {
    if (data.senderId === selectedUser._id) {
      setTyping(data.isTyping);
      if (data.isTyping) {
        setTimeout(() => setTyping(false), 3000);
      }
    }
  };

  const handleEditClick = (msg) => {
    setEditingMessageId(msg._id);
    setEditingContent(msg.content);
  };

const handleEditSubmit = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${BACKEND_URL}/api/messages/${editingMessageId}/edit`,
      { content: editingContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Update local state immediately
    setMessages(prev =>
      prev.map(msg =>
        msg._id === editingMessageId ? { ...msg, content: editingContent, isEdited: true } : msg
      )
    );

    setEditingMessageId(null);
    setEditingContent('');
  } catch (err) {
    console.error('Edit failed:', err);
  }
};


const handleDeleteClick = async (msgId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.delete(`${BACKEND_URL}/api/messages/${msgId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete response:', res.data);

    // Immediately remove message from UI
    setMessages(prev => prev.filter(msg => msg._id !== msgId));
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message);
  }
};




  const handleForward = async (msg) => {
    const receiverId = prompt('Enter receiver user ID to forward to:');
    if (!receiverId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/messages/${msg._id}/forward`,
        { receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Forward failed:', err);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Message copied');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-area">
      <div className="chat-header">...</div>
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">...</div>
        ) : (
          <>
            {Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                <div className="date-separator">
                  <span>{date}</span>
                </div>
                {dayMessages.map((msg) => (
                  <div key={msg._id} className={`message ${msg.sender._id === currentUser.id ? 'own' : 'other'}`}>
                    <div className="message-content">
                      {editingMessageId === msg._id ? (
                        <div>
                          <input
  value={editingContent}
  onChange={(e) => setEditingContent(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
/>
<button onClick={handleEditSubmit}>Save</button>

                        </div>
                      ) : (
                        <>
                          <div className="message-text">
                            {msg.content}
                            {msg.isEdited && <small> (edited)</small>}
                          </div>
                          <div className="message-meta">
                            <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                            {msg.sender._id === currentUser.id && (
                              <span className="message-status">✓✓</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {msg.sender._id === currentUser.id && (
                      <div className="message-options">
                        <button onClick={() => handleEditClick(msg)}><Edit size={14} /></button>
                        <button onClick={() => handleDeleteClick(msg._id)}><Trash2 size={14} /></button>
                        {/* <button onClick={() => handleForward(msg)}><Share size={14} /></button> */}
                        <button onClick={() => handleCopy(msg.content)}><Share size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {typing && (
              <div className="typing-indicator">...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <MessageInput
        currentUser={currentUser}
        selectedUser={selectedUser}
        socket={socket}
        onTyping={(isTyping) => {
          socket.emit('typing', {
            senderId: currentUser.id,
            receiverId: selectedUser._id,
            isTyping
          });
        }}
      />
    </div>
  );
}

export default ChatArea;