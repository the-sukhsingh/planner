"use client"
import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import ConversationManager from '@/components/ConversationManager'
// This is a server component that fetches conversation and its messages
export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {

  const [id, setId] = React.useState<string | null>(null);


  const [convData, setConvData] = React.useState<any>(null);
  const [msgData, setMsgData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);


  // const base = process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  
  
  const main = async () => {
    params.then(p => setId(p.id));
    let id = (await params).id;
    if (!id) return;
    setLoading(true);
    
    const [convRes, msgRes] = await Promise.all([
      fetch(`/api/conversations/${id}`, { cache: 'no-store' }).then(res => {
        return res;
      }).then(data => {
        return data;
      }),
      fetch(`/api/conversations/${id}/messages`, { cache: 'no-store' }),
    ])

    if (convRes.status === 200){ 
      const convData = await convRes.json()
      const msgData = await msgRes.json()
      setConvData(convData)
      setMsgData(msgData)
    }

    setLoading(false);

  }

  React.useEffect(() => {
    main();
  }, [params]);

  
  if (loading || !convData || !msgData) {
    return <div className="p-4">Loading...</div>
  }
  // Convert messages to the client-side shape
  const initialMessages = (msgData.messages || []).map((m: any) => ({
    id: m.id,
    content: m.content,
    sender: m.sender,
    timestamp: m.timestamp,
  }))

  return (
    <div className="p-4 w-full max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{convData.conversation.title}</h1>
        {/* Client-side manager */}
        {/* @ts-ignore */}
        <ConversationManager id={parseInt(id)} />
      </div>

      {/* ChatInterface is a client component; pass initial props via props */}
      <div className="h-[70vh]">
        {/* @ts-ignore */}
        <ChatInterface initialChatId={parseInt(id)} initialMessages={initialMessages} showHeader={false} showInput={false} />
      </div>

      {/* add delete manager at bottom (client side) */}
      <div className="mt-4">
        {/* @ts-ignore */}
        <script dangerouslySetInnerHTML={{ __html: '' }} />
      </div>
    </div>
  )
}