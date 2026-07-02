'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

export default function AssistantPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le bas quand un nouveau message arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="min-h-screen bg-[#F0FDF4] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#064E3B] mb-4">
            Assistant IA <span className="text-[#10B981]">Wend-Kabré</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Votre expert dédié en marchés publics au Burkina Faso. Posez-moi vos questions sur la rédaction de vos offres techniques ou administratives.
          </p>
        </div>

        {/* Fenêtre de Chat */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[600px]">
          
          {/* Zone des Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center text-4xl shadow-inner">
                  🤖
                </div>
                <h3 className="text-xl font-semibold text-[#064E3B]">Comment puis-je vous aider aujourd'hui ?</h3>
                <p className="text-gray-500 max-w-md">
                  Posez des questions comme : <br/>
                  <i>"Quels documents fournir pour un marché de 50 millions ?"</i> ou <br/>
                  <i>"Comment structurer la partie méthodologie ?"</i>
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-6 py-4 ${
                    m.role === 'user' 
                      ? 'bg-[#10B981] text-white shadow-md' 
                      : 'bg-[#F0FDF4] border border-[#A7F3D0] text-gray-800 shadow-sm'
                  }`}>
                    {/* Affichage du texte en conservant les sauts de ligne */}
                    {m.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0">
                        {/* Mise en gras rudimentaire pour les textes entre étoiles */}
                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#F0FDF4] border border-[#A7F3D0] rounded-2xl px-6 py-4 flex space-x-2 items-center">
                  <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all text-gray-800"
                value={input}
                placeholder="Posez votre question à l'expert..."
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !(input && input.trim())}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#10B981] text-white rounded-full flex items-center justify-center hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
