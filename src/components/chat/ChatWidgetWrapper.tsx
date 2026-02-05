"use client";

import dynamic from 'next/dynamic';

// Dynamically import ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
  loading: () => null
});

export default function ChatWidgetWrapper() {
  return <ChatWidget />;
}
