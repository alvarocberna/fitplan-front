
interface Props {
  title: string
  width?: string
  mb?: number
  bold?: boolean
}

export function TitleSubSec({ title, width = '100%', mb = 0, bold = true }: Props){
    return(
        <div className={`w-[${width}] my-auto mx-auto`}>
            <h2 className={`w-[full] text-xl ${bold ? 'font-bold' : 'font-normal'} text-zinc-900 mb-${mb}`}>{title}</h2>
        </div>
    )
}