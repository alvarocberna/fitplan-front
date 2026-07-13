'use client'
//react
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
//next
import { useRouter } from 'next/navigation'
//features
import { ConsultaService, AnamnesisDto, ChatMessageDto } from '@/features'
//shared
import { useConsulta } from '@/shared';


export function ChatAnamnesis() {
    const router = useRouter()
    const { anamnesis, setAnamnesis } = useConsulta()

    const OPENING_MESSAGE: ChatMessageDto = {
        role: 'assistant',
        content: '¡¡Ahora vamos a ahondar en tus objetivos, hábutos y alimentación! Primero empieza contandome sobre ti Y cual es tu principal objetivo ¿buscas ganar masa muscular, bajar de peso, mejorar rendimiento en alguna disciplina deportiva o algo por el estilo?'
    }

    const [messages, setMessages] = useState<ChatMessageDto[]>([OPENING_MESSAGE])
    const [currentAnamnesis, setCurrentAnamnesis] = useState<AnamnesisDto>(anamnesis ?? {} as AnamnesisDto)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    //enviar mensaje del usuario al backend
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: ChatMessageDto = { role: 'user', content: input.trim() }
        const updatedMessages: ChatMessageDto[] = [...messages, userMsg]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)

        try {
            const res = await ConsultaService.enviarTurnoAnamnesis({
                messages: updatedMessages,
                anamnesis: currentAnamnesis,
            })
            setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
            setCurrentAnamnesis(res.anamnesis)
            setIsComplete(res.isComplete)
        } catch {
            toast.error('Error al enviar el mensaje')
        } finally {
            setIsLoading(false)
        }
    }

    //enviar mensaje del usuario al backend con tecla enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    //actualiza context y redirecciona al formulario de evaluacion-fisica
    const handleSiguiente = () => {
        setAnamnesis(currentAnamnesis)
        router.push('/consulta/evaluacion-fisica')
    }

    
    return (
        <div className="flex flex-col h-[70vh] max-w-2xl mx-auto">

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
                                ? 'bg-green-600 text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Indicador de escritura */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1 items-center h-4">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mensaje de conversación completa */}
                {isComplete && (
                    <div className="flex justify-start">
                        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                            He recopilado suficiente información. Puedes continuar con la evaluación física.
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef}/>
            </div>

            {/* Input o botón Siguiente */}
            {isComplete ? (
                <div className="pt-4 border-t border-gray-200">
                    <div className="w-1/2 h-[40px] mx-auto">
                        <button onClick={handleSiguiente} className="primary-btn">
                            Siguiente
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder="Escribe tu respuesta... (Enter para enviar)"
                        rows={2}
                        className="flex-1 resize-none px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                    >
                        Enviar
                    </button>
                </div>
            )}
        </div>
    )
}
