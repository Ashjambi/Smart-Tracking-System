
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageSender } from '../types';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1 p-2">
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
    </div>
);

interface ChatWindowProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    isTyping: boolean;
    placeholder?: string;
    lang?: 'ar' | 'en';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isTyping, placeholder, lang = 'ar' }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };
    
    const isRtl = lang === 'ar';

    return (
        <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className={`p-4 border-b border-cyan-400/20 flex-shrink-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                <h3 className="font-bold text-lg text-white">
                    {lang === 'ar' ? 'المساعد الذكي للأمتعة' : 'Smart Baggage Assistant'}
                </h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] md:max-w-md p-3 rounded-xl shadow-md space-y-2 text-white ${
                            msg.sender === MessageSender.USER 
                                ? 'bg-brand-green text-brand-gray-dark rounded-br-none border border-cyan-400/30' 
                                : 'bg-brand-gray rounded-bl-none border border-white/10'
                        }`}>
                            {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-start gap-3 my-4 justify-start">
                        <div className="bg-brand-gray text-white rounded-xl rounded-bl-none p-2 shadow-md border border-white/10">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-cyan-400/20 flex-shrink-0">
                <form onSubmit={handleSend} className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={placeholder || (lang === 'ar' ? "اكتب استفسارك هنا..." : "Type your query here...")}
                        className="flex-1 w-full px-4 py-3 bg-brand-gray border border-cyan-400/40 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green text-white placeholder-gray-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                    />

                    <button type="submit" className="bg-brand-green text-brand-gray-dark rounded-full px-5 py-3 border border-cyan-400/50 hover:bg-brand-green-light transition duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] transform active:scale-95 font-bold">
                        {lang === 'ar' ? 'إرسال' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
