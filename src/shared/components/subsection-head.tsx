
interface Props {
  children: React.ReactNode
  width?: string 
  mb?: number
}

export function SubsectionHead({ children, width = '100%', mb = 6 }: Props){
    return(
        <div className={`mb-${mb} flex flex-col justify-between items-center mx-auto`} style={{width}}>
            {children}
        </div>
    )
}