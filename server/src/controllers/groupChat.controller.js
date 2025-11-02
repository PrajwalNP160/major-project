import GroupChatMessage from "../models/groupChatMessage.model.js";
import StudyGroup from "../models/studyGroup.model.js";
import { User } from "../models/user.model.js";

// Get chat history for a study group
export const getChatHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 100, before } = req.query;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is a member of the study group
    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const studyGroup = await StudyGroup.findById(groupId).lean();
    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Verify user is a member
    const isMember = studyGroup.members.some(
      member => member.userId.toString() === user._id.toString() && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({ 
        message: "You must be a member of this group to view chat history" 
      });
    }

    // Build query
    const query = {
      studyGroupId: groupId,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages
    const messages = await GroupChatMessage.find(query)
      .populate("userId", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    // Format messages for client
    const formattedMessages = chronologicalMessages.map(msg => ({
      id: msg._id.toString(),
      user: msg.username,
      userId: msg.userId._id.toString(),
      message: msg.message,
      ts: new Date(msg.createdAt).getTime(),
      timestamp: msg.createdAt,
      avatar: msg.userId.avatar,
    }));

    return res.status(200).json({
      messages: formattedMessages,
      hasMore: messages.length === parseInt(limit),
    });
  } catch (error) {
    console.error("getChatHistory error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Save a chat message (called by socket server)
export const saveChatMessage = async (studyGroupId, userId, username, message, socketId) => {
  try {
    const chatMessage = await GroupChatMessage.create({
      studyGroupId,
      userId,
      username,
      message,
      socketId,
    });

    // Update study group's last activity
    await StudyGroup.findByIdAndUpdate(studyGroupId, {
      lastActivity: new Date(),
    });

    return chatMessage;
  } catch (error) {
    console.error("saveChatMessage error:", error);
    throw error;
  }
};

// Delete a chat message
export const deleteMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const message = await GroupChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user owns the message or is a moderator/creator
    const studyGroup = await StudyGroup.findById(groupId).lean();
    const userMembership = studyGroup.members.find(
      m => m.userId.toString() === user._id.toString() && m.isActive
    );

    const canDelete = 
      message.userId.toString() === user._id.toString() ||
      (userMembership && ["creator", "moderator"].includes(userMembership.role));

    if (!canDelete) {
      return res.status(403).json({ 
        message: "You don't have permission to delete this message" 
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("deleteMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
