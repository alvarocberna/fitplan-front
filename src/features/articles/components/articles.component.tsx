'use client'
//REACT
import { useState, useEffect, useRef } from 'react';
//NEXT
import Link from 'next/link';
//GSAP
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
//FEATURES
import { ArticleEntityPublic, ArticlesEntityPublic } from '@/features';
//SHARED
import { SectionContainerPublic, PageContainerPublic } from '@/shared';
//COMPONENTS
import { ArticleCardPublic } from './article-card.component';
//FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faArrowRight } from '@fortawesome/free-solid-svg-icons';

gsap.registerPlugin(useGSAP,ScrollTrigger);

const MAX_ARTICLES = 9;
const PER_PAGE = 3;

interface ArticlesPublicProps {
    articlesData: ArticlesEntityPublic | null
}


/* ─── ArticlesPublic (homepage — carrusel, máx 9) ───────────────────────── */
export function ArticlesPublic({ articlesData }: ArticlesPublicProps) {
    const [page, setPage] = useState(0);
    const [tick, setTick]     = useState(0); // reinicia el intervalo al navegar

    const filteredArticles = (articlesData?.articulo ?? [])
        .filter(art => art.status === 'approved' && art.activo === true)
        .slice(0, MAX_ARTICLES);

    const totalPages = Math.ceil(filteredArticles.length / PER_PAGE);

    // Auto-avance; se reinicia cuando el usuario navega manualmente (tick cambia)
    useEffect(() => {
        if (totalPages <= 1) return;
        const id = setInterval(() => setPage(p => (p + 1) % totalPages), 5000);
        return () => clearInterval(id);
    }, [totalPages, tick]);

    const goTo = (newPage: number) => {
        setPage(newPage);
        setTick(t => t + 1);
    };

    const pageArticles = filteredArticles.slice(
        page * PER_PAGE,
        page * PER_PAGE + PER_PAGE
    );

    const compRef = useRef(null);

    useGSAP(() => {
        if(!articlesData) return;

        const gsapTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: compRef.current,
                start: 'top 65%',
                end: 'bottom top',
                markers: false,
            }
        });
        gsapTimeline.from(['.head-element', '.body-element'], {
            y: 50,
            opacity: 0,
            ease: "power2.inOut",
            duration: 1,
            stagger: 0.3
        })
    }, { scope: compRef, dependencies: [articlesData] })

    if (!articlesData) return null;

    return (
        <div ref={compRef}>
            {articlesData.activo && (
                <SectionContainerPublic id='articulos'>
                    <div className='w-full flex flex-col'>

                        {/* Encabezado */}
                        <div className="head-element mb-12 flex flex-col justify-start">
                            <span className="inline-block self-start px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 text-etiqueta-texto bg-etiqueta">
                                Blog
                            </span>
                            <h2 className="text-4xl font-extrabold text-texto mb-4">
                                {articlesData.titulo}
                            </h2>
                            <p className="text-gris text-lg max-w-xl">
                                {articlesData.descripcion}
                            </p>
                        </div>

                        {/* Carrusel */}
                        <div className="body-element relative cards-element">
                            {/* Botón anterior */}
                            {totalPages > 1 && (
                                <button
                                    onClick={() => goTo((page - 1 + totalPages) % totalPages)}
                                    className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-superficie border border-gris-claro shadow-sm hover:bg-fondo transition-colors"
                                    aria-label="Anterior"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-gris-oscuro text-sm" />
                                </button>
                            )}

                            {/* Tarjetas */}
                            <div className='w-full flex flex-wrap -mx-2'>
                                {pageArticles.map((art: ArticleEntityPublic, index: number) => (
                                    <ArticleCardPublic key={index} article={art} />
                                ))}
                            </div>

                            {/* Botón siguiente */}
                            {totalPages > 1 && (
                                <button
                                    onClick={() => goTo((page + 1) % totalPages)}
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-superficie border border-gris-claro shadow-sm hover:bg-fondo transition-colors"
                                    aria-label="Siguiente"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="text-gris-oscuro text-sm" />
                                </button>
                            )}
                        </div>

                        {/* Dots */}
                        {totalPages > 1 && (
                            <div className="body-element flex justify-center gap-2 mt-6">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goTo(i)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            i === page ? 'w-6 bg-lila' : 'w-2 bg-gris-claro'
                                        }`}
                                        aria-label={`Página ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Ver todos */}
                        <div className="body-element flex justify-center mt-10">
                            <Link
                                href="/articulos"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-lila text-lila text-sm font-semibold hover:bg-lila hover:text-texto-invertido transition-colors duration-200"
                            >
                                Ver todos los artículos
                                <FontAwesomeIcon icon={faArrowRight} />
                            </Link>
                        </div>
                    </div>
                </SectionContainerPublic>
            )}
        </div>
    );
}


/* ─── ArticlesAllPublic (página /articulos — todos) ───────────────────── */
export function ArticlesAllPublic({articlesData}: ArticlesPublicProps) {


    const filteredArticles = (articlesData?.articulo ?? [])
        .filter(art => art.status === 'approved' && art.activo === true);

    if (!articlesData) return null;

    return (
        <PageContainerPublic>
            <div className='w-full flex flex-col'>

                {/* Encabezado */}
                <div className="mb-12 flex flex-col justify-start">
                    <span className="inline-block self-start px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-lila bg-lila-claro/20 mb-4">
                        Blog
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-zinc-800">
                        {articlesData.titulo}
                    </h2>
                    {articlesData.descripcion && (
                        <p className="text-gris text-lg max-w-xl">
                            {articlesData.descripcion}
                        </p>
                    )}
                </div>

                {/* Grid de todos los artículos */}
                {filteredArticles.length === 0 ? (
                    <p className="text-gris text-center py-16">No hay artículos publicados.</p>
                ) : (
                    <div className='w-full flex flex-wrap -mx-2 pb-10'>
                        {filteredArticles.map((art: ArticleEntityPublic, index: number) => (
                            <ArticleCardPublic key={index} article={art} />
                        ))}
                    </div>
                )}
            </div>
        </PageContainerPublic>
    );
}
