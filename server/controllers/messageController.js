// controllers/messageController.js
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', replyTo } = req.body;
    const senderId = req.user.userId;

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('sender receiver replyTo', 'username avatar content');

    let chat = await Chat.findOne({ participants: { $all: [senderId, receiverId] } });
    if (!chat) {
      chat = new Chat({ participants: [senderId, receiverId] });
    }
    chat.lastMessage = message._id;
    chat.lastMessageTime = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.content = req.body.content;
    message.isEdited = true;
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const original = await Message.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Original message not found' });

    const newMessage = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content: original.content,
      messageType: original.messageType,
      fileUrl: original.fileUrl,
      fileName: original.fileName,
      forwardedFrom: original.sender,
    });

    await newMessage.save();
    await newMessage.populate('sender receiver forwardedFrom', 'username avatar');

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
