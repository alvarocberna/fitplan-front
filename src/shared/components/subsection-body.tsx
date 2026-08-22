interface Props {
    children: React.ReactNode
    width?: string
}

export function SubsectionBody({children, width = '100%'}: Props){
    return(
        <div className={`flex flex-col justify-center items-center mx-auto`} style={{width}}>
            {children}
        </div>
    )
}