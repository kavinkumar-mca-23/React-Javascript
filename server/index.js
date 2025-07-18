import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// 🧠 Import Models (needed for sockets)
import Message from './models/Message.js';
import Chat from './models/Chat.js';
// import User from './models/User.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // 👈 Adjust if needed for security
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// 📦 Middleware
app.use(cors());
app.use(express.json());

// 🌐 Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// ⚡ Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, content, messageType } = data;

      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
        messageType
      });

      await message.save();
      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      let chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] }
      });

      if (!chat) {
        chat = new Chat({
          participants: [senderId, receiverId],
          lastMessage: message._id,
          lastMessageTime: new Date()
        });
      } else {
        chat.lastMessage = message._id;
        chat.lastMessageTime = new Date();
      }

      await chat.save();

      io.to(senderId).emit('newMessage', message);
      io.to(receiverId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.receiverId).emit('userTyping', {
      senderId: data.senderId,
      isTyping: data.isTyping
    });
  });

  socket.on('markAsRead', async ({ messageId, userId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: new Date()
      });

      io.to(userId).emit('messageRead', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('editMessage', async ({ messageId, newContent }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      message.content = newContent;
      message.isEdited = true;
      await message.save();

      io.to(message.receiver.toString()).emit('messageEdited', message);
    } catch (err) {
      console.error('Edit message error:', err);
    }
  });

  socket.on('deleteMessage', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const receiverId = message.receiver.toString();
      const senderId = message.sender.toString();

      await message.deleteOne();

      io.to(senderId).emit('messageDeleted', { messageId });
      io.to(receiverId).emit('messageDeleted', { messageId });

    } catch (err) {
      console.error('Delete message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 🛢️ Connect DB & start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 8000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 8000}`)
    );
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
