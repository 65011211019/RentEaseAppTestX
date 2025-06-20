import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationMessages, sendMessage, markMessagesAsRead, getConversations } from '../../services/chatService';
import { ChatMessage, ChatConversation, ApiError, User } from '../../types'; // Assuming ChatConversation might be needed for context
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';
import { io, Socket } from 'socket.io-client';

// Placeholder for fetching conversation details if needed (e.g., other user's name)
// const getConversationDetails = async (conversationId: string): Promise<Partial<ChatConversation>> => {
//     return new Promise(res => setTimeout(() => res({other_user: {id:2, first_name: "Mock Partner"}}), 100));
// }

// ฟังก์ชันแปลงข้อความให้ preview ลิงก์ (url) ได้
function renderMessageWithLinks(text: string) {
  if (!text) return null;
  // Regex match url (http/https)
  const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)|(www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(urlRegex)) {
      const url = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all hover:text-blue-800 transition-colors">{part}</a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const ChatRoomPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationInfo, setConversationInfo] = useState<Partial<ChatConversation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessageContent, setNewMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'file' | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const fetchMessages = async (opts?: { before_message_id?: string }) => {
    if (conversationId) {
      setIsLoading(true);
      try {
        const msgs = await getConversationMessages(conversationId, { before_message_id: opts?.before_message_id, limit: 20 });
        if (opts?.before_message_id) {
          setMessages(prev => [...msgs, ...prev]);
          setHasMore(msgs.length === 20);
        } else {
          setMessages(msgs);
          setHasMore(msgs.length === 20);
        }
        await markMessagesAsRead(conversationId);
      } catch (err) {
        setError((err as ApiError).message || "Failed to load messages.");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    }
  };
  
  useEffect(() => {
    fetchMessages();
  }, [conversationId, authUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Connect socket.io
    const socket = io(process.env.VITE_SOCKET_URL || 'https://renteaseapptestapi.onrender.com', {
      auth: { token: localStorage.getItem('authToken') },
      transports: ['websocket']
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (conversationId) {
        socket.emit('join_conversation', conversationId);
        console.log('Emit join_conversation', conversationId);
      }
    });
    socket.on('new_message', (msg: any) => {
      console.log('Received new_message:', msg);
      setMessages(prev => {
        if (prev.some(m => m.message_uid === msg.message_uid)) return prev;
        const updated = [...prev, msg];
        console.log('Updated messages after push:', updated);
        return updated;
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    return () => {
      socket.disconnect();
      console.log('Socket disconnected (cleanup)');
    };
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !conversationId) return;
    setIsSending(true);
    try {
      const sentMessage = await sendMessage({ conversation_id: conversationId, message_content: newMessageContent });
      setMessages(prev => [...prev, sentMessage]);
      setNewMessageContent('');
      await markMessagesAsRead(conversationId);
    } catch (err) {
      setError((err as ApiError).message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    console.log('Rendering messages:', messages);
  }, [messages]);

  // Unique messages for rendering
  const uniqueMessages = React.useMemo(() => {
    const seen = new Set();
    return messages.filter(msg => {
      const key = msg.message_uid || (msg.id + '_' + msg.sent_at);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  // Fetch conversation info for header (who are you chatting with)
  useEffect(() => {
    const fetchConversationInfo = async () => {
      if (!conversationId) return;
      try {
        // No getConversationById, so fetch all and find the one we want
        const { data } = await getConversations({ page: 1, limit: 50 });
        const convo = data.find((c) => c.id == conversationId);
        setConversationInfo(convo || null);
      } catch (err) {
        setConversationInfo(null);
      }
    };
    fetchConversationInfo();
  }, [conversationId]);

  // อัปโหลดไฟล์ในแชท
  const handleFileUpload = async (file: File, messageContent = '') => {
    if (!conversationId) return;
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (messageContent) formData.append('message_content', messageContent);
      const token = localStorage.getItem('authToken');
      const res = await fetch(
        `/api/chat/conversations/${conversationId}/messages/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
            // **อย่าใส่ Content-Type เอง**
          },
          body: formData
        }
      );
      const data = await res.json();
      // เพิ่ม message ที่ได้เข้า state (หรือรอ socket ก็ได้)
      setMessages(prev => [...prev, data.data]);
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setFileUploading(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading chat..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-2 md:p-0 h-[calc(100vh-128px)] flex flex-col max-w-2xl shadow-xl rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
      <div className="bg-white/80 shadow-md p-4 rounded-t-xl flex flex-col gap-2 sticky top-0 z-10">
        <Link to={ROUTE_PATHS.CHAT_INBOX} className="text-blue-600 hover:underline text-sm mb-2 inline-block transition-colors">&larr; Back to Inbox</Link>
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          {conversationInfo?.other_user?.first_name
            ? `Chat with ${conversationInfo.other_user.first_name}`
            : 'Chat Room'}
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto bg-gradient-to-b from-white via-blue-50 to-blue-100 p-4 space-y-4 custom-scrollbar">
        {hasMore && !isLoading && (
          <div className="text-center mb-2">
            <button className="text-blue-500 underline hover:text-blue-700 transition-colors" disabled={loadingMore} onClick={() => {
              setLoadingMore(true);
              fetchMessages({ before_message_id: messages[0]?.id });
            }}>Load previous</button>
          </div>
        )}
        {uniqueMessages.map(msg => (
          <div key={msg.message_uid || (msg.id + '_' + msg.sent_at)} className={`flex ${msg.sender_id === authUser?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md transition-all duration-200 ${msg.sender_id === authUser?.id ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'} group relative`}>
              {/* ถ้ามีไฟล์แนบ */}
              {msg.attachment_url && (
                msg.message_type === 'image' ? (
                  <img
                    src={msg.attachment_url}
                    alt="attachment"
                    className="max-h-40 mb-2 rounded-lg cursor-pointer border border-blue-200 group-hover:shadow-lg transition-all"
                    onClick={() => {
                      setPreviewUrl(msg.attachment_url!);
                      setPreviewType('image');
                      setPreviewName(msg.attachment_metadata?.originalname || null);
                    }}
                  />
                ) : (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block mb-2 cursor-pointer hover:text-blue-800"
                    onClick={e => {
                      e.preventDefault();
                      setPreviewUrl(msg.attachment_url!);
                      setPreviewType('file');
                      setPreviewName(msg.attachment_metadata?.originalname || null);
                    }}
                  >
                    📎 {msg.attachment_metadata?.originalname || 'Download file'}
                  </a>
                )
              )}
              <p className="break-words whitespace-pre-line text-base">
                {renderMessageWithLinks(msg.message_content)}
              </p>
              <p className={`text-xs mt-1 ${msg.sender_id === authUser?.id ? 'text-blue-200' : 'text-gray-400'} text-right`}> {new Date(msg.sent_at).toLocaleTimeString()} </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white/90 p-4 border-t rounded-b-xl shadow-lg sticky bottom-0 z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <InputField
            name="newMessage"
            type="text"
            value={newMessageContent}
            onChange={e => setNewMessageContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow !mb-0 rounded-full border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 px-4 py-2 transition-all"
            autoComplete="off"
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file, newMessageContent);
                setNewMessageContent('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.zip,.rar,.txt,.csv,.ppt,.pptx,.doc,.docx"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={fileUploading}
            isLoading={fileUploading}
            className="!px-3 !py-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow-md transition-all"
            title="แนบไฟล์"
          >
            <span className="text-xl">📎</span>
          </Button>
          <Button type="submit" isLoading={isSending} disabled={!newMessageContent.trim()} className="rounded-full px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all">
            Send
          </Button>
        </form>
      </div>

      {/* Modal สำหรับ preview ไฟล์/รูป */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-all" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-full max-h-full p-4 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-2xl transition-colors" onClick={() => setPreviewUrl(null)}>&times;</button>
            {previewType === 'image' ? (
              <img src={previewUrl} alt={previewName || 'preview'} className="max-h-[70vh] max-w-[80vw] object-contain rounded-xl shadow" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="mb-2 font-semibold text-lg">{previewName || 'File preview'}</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-lg hover:text-blue-800 transition-colors">Download / Open</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
