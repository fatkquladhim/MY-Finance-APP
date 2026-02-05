"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ConversationList from '@/components/chat/ConversationList';
import type { ConversationListItem } from '@/types/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversationId(id);
        setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (conversationId === id) {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!session) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
          includeFinancialContext: true
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send message');
      }

      const data = await res.json();
      
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
        loadConversations();
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response.content,
        timestamp: data.response.timestamp
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [session, conversationId]);

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-64px)] flex bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-80' : 'w-0'} flex-shrink-0 border-r dark:border-gray-700 bg-white dark:bg-gray-800 transition-all overflow-hidden`}>
          <ConversationList
            conversations={conversations}
            activeConversationId={conversationId}
            onSelectConversation={loadConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🤖</span> FinBot - AI Financial Assistant
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tanya apa saja tentang keuangan Anda
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="text-5xl">💰</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Selamat datang di FinBot!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                  Saya adalah asisten keuangan pribadi Anda yang didukung AI. 
                  Tanyakan tentang pengeluaran, budget, investasi, atau tips keuangan lainnya!
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    { icon: '📊', text: 'Analisis pengeluaran bulan ini' },
                    { icon: '💡', text: 'Tips menabung efektif' },
                    { icon: '📋', text: 'Cara membuat budget' },
                    { icon: '📈', text: 'Ringkasan keuangan saya' }
                  ].map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => sendMessage(suggestion.text)}
                      className="flex items-center gap-2 p-3 text-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <span className="text-gray-700 dark:text-gray-300">{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              {error && (
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm mb-4">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={sendMessage}
                disabled={isLoading || !session}
                placeholder="Tanya sesuatu tentang keuangan Anda..."
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
