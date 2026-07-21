
interface Props {
  title: string
  width?: string
  mb?: number
}

export function TitleSubSec({ title, width = '100%', mb = 0 }: Props){
    return(
        <div className={`w-[${width}] my-auto mx-auto`}>
            <h2 className={`w-[full] text-xl font-bold text-zinc-900 mb-${mb}`}>{title}</h2>
        </div>
    )
}