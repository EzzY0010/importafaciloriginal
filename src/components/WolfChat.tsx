import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, ImagePlus, Loader2, MessageSquare, Plus, Menu, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

// Parse markdown links to clickable elements
const renderMessageContent = (content: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-secondary underline hover:text-secondary/80 font-medium"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

const WolfChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        image_url: m.image_url || undefined
      })));
    }
  };

  const createNewConversation = async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select()
      .single();
    
    if (data) {
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);
      setSidebarOpen(false);
      return data.id;
    }
    return null;
  };

  const selectConversation = async (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    await loadMessages(conv.id);
    setSidebarOpen(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role,
      content,
      image_url: imageUrl
    });
  };

  const sendMessage = async () => {
    if (!input.trim() && !imagePreview) return;
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado', variant: 'destructive' });
      return;
    }

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      image_url: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);

    await saveMessage(convId, 'user', input, imagePreview || undefined);

    if (messages.length === 0 && input.trim()) {
      const title = input.substring(0, 50) + (input.length > 50 ? '...' : '');
      await supabase.from('conversations').update({ title }).eq('id', convId);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
    }

    try {
      const messageContent = imagePreview 
        ? [
            { type: 'text', text: input || 'Analise esta imagem de produto para importação' },
            { type: 'image_url', image_url: { url: imagePreview } }
          ]
        : input;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wolf-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: messageContent }],
          conversationId: convId,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      await saveMessage(convId, 'assistant', assistantMessage);

    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Erro', description: 'Falha ao enviar mensagem', variant: 'destructive' });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-3 relative max-w-4xl mx-auto w-full">
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden absolute top-3 left-3 z-10 bg-card"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <Card className={`
        ${sidebarOpen ? 'absolute inset-0 z-20' : 'hidden'} 
        md:relative md:flex md:w-16 p-2 flex-col items-center border border-border rounded-2xl shadow-card
      `}>
        <Button 
          onClick={createNewConversation} 
          size="icon" 
          className="mb-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-soft"
          title="Nova Conversa"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center group relative transition-all ${
                  currentConversationId === conv.id 
                    ? 'bg-primary text-primary-foreground shadow-soft' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                onClick={() => selectConversation(conv)}
                title={conv.title}
              >
                <MessageSquare className="h-4 w-4" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-0 shadow-soft"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Chat Header */}
        <div className="text-center p-5 border-b border-border bg-card">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2 text-foreground">
            <span className="md:hidden w-8" />
            🐺 Lobo das Importações
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Seu especialista em vendas e importação</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 transition-colors">
          <div className="p-4 space-y-4 min-h-full">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12 px-4">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🐺</span>
                </div>
                <p className="text-lg font-medium text-foreground">Olá! Eu sou o Lobo das Importações!</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">
                  Envie uma foto de um produto ou me pergunte qualquer coisa sobre importação!
                </p>
                <p className="text-xs mt-4 text-muted-foreground/70">
                  💡 Dica: Digite "modo garimpo" para ativar a busca automática de produtos!
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.image_url && (
                    <img src={msg.image_url} alt="Uploaded" className="max-w-full rounded-xl mb-3 max-h-48 object-contain" />
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{renderMessageContent(msg.content)}</p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 pb-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-xl border border-border" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-border hover:bg-muted"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              disabled={isLoading}
              className="flex-1 rounded-xl border-border focus-visible:ring-primary"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-5 shadow-soft"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WolfChat;