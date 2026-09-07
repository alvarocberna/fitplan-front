'use client'
//NEXT
import Link from 'next/link';
import Image from 'next/image';
//FEATURES
import { ArticleEntityPublic } from '@/features';
//CONFIG
import { INTEGRATION_CONFIG } from '@/features/config';
//FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface ArticleCardProps {
    article: ArticleEntityPublic;
}

const STYLE = INTEGRATION_CONFIG.article.style;

export function ArticleCardPublic({ article }: ArticleCardProps){
    let date = new Date(article.fecha_publicacion)
    let fecha = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');

    return(
        <>
        {
            STYLE === 'style2' ? (
                <div className='w-full sm:w-1/2 lg:w-1/3 px-2 mb-4'>
                    <Link href={`/articulos/${article.slug}`} className='card hover-btn w-full h-full flex flex-col justify-between overflow-hidden'>
                        <div>
                            <div className='w-full h-48 relative'>
                                <Image
                                    src={article.image_url || ''}
                                    alt={article.image_alt!}
                                    fill={true}
                                    unoptimized
                                    className='object-cover'
                                />
                            </div>
                            {/* cuerpo */}
                            <div className='mx-5 my-5'>
                                <h4 className='text-md font-semibold text-texto'>{article.titulo}</h4>
                                {
                                    article.subtitulo &&
                                    <div className='text-xs text-gris-suave'>
                                        {article.subtitulo}
                                    </div>

                                }
                            </div>
                        </div>
                        <div className='mx-5 mb-5 pt-5 text-xs text-gris-suave border-t border-gris-claro flex justify-between'>
                            <span>
                                {fecha}
                            </span>
                            <span className='text-cs font-semibold text-gris-oscuro'>
                                Leer articulo <FontAwesomeIcon icon={faArrowRight} style={{fontSize: '12px'}}/>
                            </span>
                        </div>
                    </Link>
                </div>
            )
            :
            (
                <div className='w-full sm:w-1/2 lg:w-1/3 px-2 mb-4'>
                    <Link href={`/articulos/${article.slug}`} className='card hover-btn w-full h-full flex flex-col justify-between overflow-hidden'>
                        <div>
                            <div
                                className="h-2 w-full"
                                style={{ background: 'var(--color-lila)' }}
                            />
                            {/* cuerpo */}
                            <div className='mx-6 my-6'>
                                <h4 className='text-md font-semibold text-gris-oscuro'>{article.titulo}</h4>
                                {
                                    article.subtitulo &&
                                    <div className='text-xs text-gris-suave'>
                                        {article.subtitulo}
                                    </div>

                                }
                            </div>
                        </div>
                        <div className='mx-6 mb-6 pt-6 text-xs text-gris-suave flex justify-between border-t border-gris-claro'>
                            <span>
                                {fecha}
                            </span>
                            <span className='text-cs font-semibold text-gris-oscuro'>
                                Leer articulo <FontAwesomeIcon icon={faArrowRight} style={{fontSize: '12px'}}/>
                            </span>
                        </div>
                    </Link>
                </div>
            )
        }
        </>
    )
}
