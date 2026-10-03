// Estado de carga de las páginas del área de sesión mientras su Server Component espera al backend
// (se muestra dentro de SesionShell: la barra superior y el sidebar quedan visibles).
export default function SesionLoading() {
    return (
        <div role="status" aria-label="Cargando" className="w-full flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
    )
}
