
interface Props {
    children?: React.ReactNode
    height?: string //
}

export function SubsectionFooter({children, height = '25px' }: Props){
    return(
        <div className={`h-[${height}] w-full`}>
            {children}
        </div>
    )
}