'use client'
//react
import { useState, useEffect, useRef } from 'react'
//next
import { useRouter } from 'next/navigation'
//features
import { ConsultationService, AnamnesisDto, ChatMessageDto } from '@/features'
//shared
import { useConsultation, notifyError } from '@/shared';


// mensaje mostrado en el chat: además de role/content (lo que viaja al backend como
// historial), puede llevar el titleReply devuelto por el backend para ese turno
type DisplayMessage = ChatMessageDto & { titleReply?: string }

export function ChatAnamnesis() {
    const router = useRouter()
    const { anamnesis, setAnamnesis } = useConsultation()

    const OPENING_MESSAGE: DisplayMessage = {
        role: 'assistant',
        content: '¡Hola! ¿Cómo estás? Soy Nuvi y hoy tendré el gusto de acompañarte como tu nutricionista. Comencemos con lo más importante: ¡tus objetivos! Por favor, cuéntame qué es lo que estás buscando. ¿Quieres ganar músculo? ¿Bajar de peso? ¿Mejorar rendimiento en algún deporte? Sea cual sea tu objetivo, por favor, coméntamelo.',
        titleReply: 'Definición de objetivos'
    }

    const [messages, setMessages] = useState<DisplayMessage[]>([OPENING_MESSAGE])
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
        const updatedMessages: DisplayMessage[] = [...messages, userMsg]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)

        try {
            // el backend valida messages contra { role, content } exclusivamente
            // (forbidNonWhitelisted): se despoja titleReply antes de enviar el historial
            const historyMessages: ChatMessageDto[] = updatedMessages.map(({ role, content }) => ({ role, content }))

            const res = await ConsultationService.sendAnamnesisTurn({
                messages: historyMessages,
                anamnesis: currentAnamnesis,
            })
            setMessages(prev => [...prev, { role: 'assistant', content: res.reply, titleReply: res.titleReply }])
            setCurrentAnamnesis(res.anamnesis)
            setIsComplete(res.isComplete)
        } catch (error) {
            //el mensaje del usuario queda en pantalla: puede reintentar enviando de nuevo
            notifyError(error, 'No pudimos enviar tu mensaje. Intenta nuevamente.')
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
    const handleNext = () => {
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
                                ? 'bg-(--color-primary) text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                            {msg.role === 'assistant' && msg.titleReply && (
                                <p className="font-bold mb-1">{msg.titleReply}</p>
                            )}
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
                        <div className="bg-(--color-primary)/10 border border-(--color-primary)/30 text-(--color-secondary) rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
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
                        <button onClick={handleNext} className="primary-btn">
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
                        className="flex-1 resize-none px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-2 bg-(--color-primary) text-white text-sm font-medium rounded-xl hover:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                    >
                        Enviar
                    </button>
                </div>
            )}
        </div>
    )
}
