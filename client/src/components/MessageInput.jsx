
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';

function MessageInput({ currentUser, selectedUser, socket, onTyping }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedUser]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() && socket) {
      socket.emit('sendMessage', {
        senderId: currentUser.id,
        receiverId: selectedUser._id,
        content: message.trim(),
        messageType: 'text'
      });

      setMessage('');
      setIsTyping(false);
      onTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Handle voice recording logic here
    console.log('Voice recording:', !isRecording ? 'started' : 'stopped');
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSendMessage} className="input-form">
        <div className="input-actions">
          <label className="file-upload-btn" title="Attach file">
            <Paperclip size={20} />
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
          </label>
        </div>

        <div className="input-container">
          <button type="button" className="emoji-btn" title="Add emoji">
            <Smile size={20} />
          </button>
          
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="message-text-input"
            rows={1}
            maxLength={1000}
          />
        </div>

        <div className="send-actions">
          {message.trim() ? (
            <button type="submit" className="send-btn" title="Send message">
              <Send size={20} />
            </button>
          ) : (
            <button 
              type="button" 
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleVoiceRecord}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default MessageInput;
