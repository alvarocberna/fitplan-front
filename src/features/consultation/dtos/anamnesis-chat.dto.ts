import { AnamnesisDto } from './consultation.dto'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessageDto { 
    role: ChatRole
    content: string
}

// Lo que el frontend envía en cada turno
export interface InputChatDto {
    messages: ChatMessageDto[] //historial completo de la conversación (cada req lleva todo el contexto necesario para seguir la conversacion)
    anamnesis: AnamnesisDto //estado actual del DTO. El LLM lo usa para saber que campos ya tiene y cual le falta
}

// Lo que el backend devuelve en cada turno
export interface OutputChatDto {
    reply: string //texto que el LLM generó para el usuario - la siguiente pregunta o seguimiento
    titleReply: string //título corto tipo resumen del tema abordado en "reply" (ej. "Definición de objetivos")
    anamnesis: AnamnesisDto //campos completados por el LLM
    isComplete: boolean  //flag que el backend activa cuando considera que hay sificientre info, activa el botón para Siguiente y avanzar a la evaluacion física
}
