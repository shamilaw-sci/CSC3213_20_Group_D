import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle, Globe, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

// TEMPORARY: hardcoded test patient UUID until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

/* eslint-disable no-unused-vars */
// Extracted outside the component for better performance. 
// We safely destructure 'node' out so it doesn't get passed to the HTML elements.
const MarkdownComponents = {
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  h3: ({ node, ...props }) => <h3 className="font-bold text-base mt-4 mb-2 text-[#1E3A5F]" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
};
/* eslint-enable no-unused-vars */

export default function AIChatWidget() {
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
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.post(`/api/patients/${TEST_PATIENT_ID}/chat`, {
        message: userMessage.text,
        language: language
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
    <div className={`fixed z-50 flex flex-col ${isFullScreen && isOpen ? 'inset-0 items-stretch bg-slate-50' : 'bottom-6 right-6 items-end'}`}>
      
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
          isFullScreen 
            ? 'w-full h-full rounded-none border-none' 
            : 'w-87.5 sm:w-100 h-125 max-h-[75vh] rounded-2xl border border-slate-200 mb-4'
        }`}>
          
          {/* Header */}
          <div className="bg-[#1E3A5F] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                <MessageCircle size={18} className="text-blue-100" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-tight">Care4U Assistant</h3>
                <p className="text-[11px] text-blue-200 font-medium tracking-wide">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
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
          <div className="bg-amber-50 border-b border-amber-200 p-2.5 flex gap-2.5 items-start shrink-0">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug text-amber-900 font-medium">
              AI-generated, not a medical diagnosis. Always consult a doctor for medical advice.
            </p>
          </div>

          {/* Message History */}
          <div className={`flex-1 overflow-y-auto p-4 bg-slate-50 space-y-5 ${isFullScreen ? 'px-8 md:px-24 lg:px-48' : ''}`}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#1E3A5F] text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown components={MarkdownComponents}>
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className={`p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0 ${isFullScreen ? 'px-8 md:px-24 lg:px-48 pb-6 pt-4' : ''}`}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-5 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/50 focus:bg-white transition-colors"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E75B6] transition-colors shadow-sm"
            >
              <Send size={18} className="-ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'hidden' : 'flex'} w-16 h-16 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white rounded-full shadow-xl shadow-blue-900/20 items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white`}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={30} />
      </button>

    </div>
  );
}