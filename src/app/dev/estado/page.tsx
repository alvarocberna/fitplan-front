'use client'
import { useConsulta } from '@/shared'

export default function EstadoConsultaPage() {
    const {
        informacionPersonal,
        anamnesis,
        mediciones,
        reset,
        resetInformacionPersonal,
        resetAnamnesis,
        resetMediciones,
    } = useConsulta()

    const sections = [
        { label: 'informacionPersonal', data: informacionPersonal, onReset: resetInformacionPersonal },
        { label: 'anamnesis', data: anamnesis, onReset: resetAnamnesis },
        { label: 'mediciones', data: mediciones, onReset: resetMediciones },
    ]

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800">Estado de ConsultaContext</h1>
                <button
                    onClick={reset}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                    Reset
                </button>
            </div>
            {sections.map(({ label, data, onReset }) => (
                <div key={label} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-mono font-medium text-gray-600">{label}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${data ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {data ? 'con datos' : 'null'}
                            </span>
                            <button
                                onClick={onReset}
                                className="text-xs font-medium px-2 py-0.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    <pre className="text-xs text-gray-700 p-4 overflow-x-auto bg-white">
                        {data ? JSON.stringify(data, null, 2) : 'null'}
                    </pre>
                </div>
            ))}
        </div>
    )
}
