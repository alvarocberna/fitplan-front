interface Props {
    url: string
    title?: string
    downloadLabel?: string
}

// `url` es una URL firmada de corta duración hacia el bucket S3 (ver StorageService en el
// backend) — no se persiste ni se reutiliza más allá de esta visualización.
export function PdfViewer({ url, title = 'Plan nutricional', downloadLabel = 'Descargar PDF' }: Props) {
    return (
        <div className="w-full flex flex-col gap-3">
            <iframe
                src={url}
                title={title}
                className="w-full h-[600px] rounded-[8px] border border-white/40 bg-white"
            />
            <a
                href={url}
                download
                className="primary-btn inline-block text-center no-underline self-center"
            >
                {downloadLabel}
            </a>
        </div>
    )
}
