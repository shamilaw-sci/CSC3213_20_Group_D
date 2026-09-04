import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle, Globe, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import remarkGfm from 'remark-gfm';
import useAuthStore from '../../store/authStore';

/* eslint-disable no-unused-vars */
// Extracted outside the component for better performance. 
// We safely destructure 'node' out so it doesn't get passed to the HTML elements.
const MarkdownComponents = {
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  h3: ({ node, ...props }) => <h3 className="font-bold text-base mt-4 mb-2 text-brand-deep" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  
  // --- NEW: Beautiful Table Formatting ---
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border shadow-sm">
      <table className="min-w-full divide-y divide-border text-[13.5px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
  th: ({ node, ...props }) => <th className="px-4 py-2.5 text-left font-semibold text-foreground" {...props} />,
  tbody: ({ node, ...props }) => <tbody className="bg-background divide-y divide-border" {...props} />,
  td: ({ node, ...props }) => <td className="px-4 py-2.5 text-muted-foreground" {...props} />,
};
/* eslint-enable no-unused-vars */

export default function AIChatWidget() {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your Care4U AI Assistant. How can I help you navigate the app or answer general health questions today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'English' ? 'Sinhala' : 'English');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: inputText };
    
    // Map the web state format to the format the backend expects
    const formattedHistory = messages.map(msg => ({
      role: msg.sender,
      content: msg.text
    }));

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.post(`/api/patients/${TEST_PATIENT_ID}/chat`, {
        message: userMessage.text,
        language: language,
        history: formattedHistory // <-- Sending the context here!
      });

      if (response.data.success) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: response.data.data.reply }
        ]);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed z-50 flex flex-col ${isFullScreen && isOpen ? 'inset-0 items-stretch bg-background' : 'bottom-6 right-6 items-end'}`}>
      
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`bg-background shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
          isFullScreen 
            ? 'w-full h-full rounded-none border-none' 
            : 'w-87.5 sm:w-100 h-125 max-h-[75vh] rounded-2xl border border-border mb-4'
        }`}>
          
          {/* Header */}
          <div className="bg-brand-deep text-brand-deep-foreground p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <MessageCircle size={18} className="text-brand-deep-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-tight">Care4U Assistant</h3>
                <p className="text-[11px] text-brand-deep-foreground/80 font-medium tracking-wide">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-brand-deep-foreground/90">
              <button 
                onClick={toggleLanguage}
                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded flex items-center gap-1.5 transition-colors font-medium"
                title="Toggle Language"
              >
                <Globe size={13} />
                {language === 'English' ? 'EN' : 'සිං'}
              </button>
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="hover:text-white transition-colors p-1"
                title={isFullScreen ? "Minimize" : "Maximize"}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={() => { setIsOpen(false); setIsFullScreen(false); }} 
                className="hover:text-white transition-colors p-1 ml-1"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Strict Disclaimer Banner */}
          <div className="bg-muted border-b border-border p-2.5 flex gap-2.5 items-start shrink-0">
            <AlertTriangle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug text-muted-foreground font-medium">
              AI-generated, not a medical diagnosis. Always consult a doctor for medical advice.
            </p>
          </div>

          {/* Message History */}
          <div className={`flex-1 overflow-y-auto p-4 bg-background space-y-5 ${isFullScreen ? 'px-8 md:px-24 lg:px-48' : ''}`}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-background text-foreground border border-border rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown 
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background text-muted-foreground border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className={`p-3 bg-background border-t border-border flex gap-2 shrink-0 ${isFullScreen ? 'px-8 md:px-24 lg:px-48 pb-6 pt-4' : ''}`}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-muted border border-transparent rounded-full px-5 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-sm"
            >
              <Send size={18} className="-ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'hidden' : 'flex'} w-16 h-16 bg-primary hover:opacity-90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-background`}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={30} />
      </button>

    </div>
  );
}