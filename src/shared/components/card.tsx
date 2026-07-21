
interface Props {
  children: React.ReactNode
  width?: string 
  widthInner?: string
  height?: string
}

export function Card({ children, width = '100%', widthInner = '90%', height = '100%' }: Props){
    return(
        <div className="py-10 flex mx-auto bg-white/30 backdrop-blur-md border border-white/40 rounded-[12px] mb-5 shadow-lg"
        style={{ width, height }}
        >
            <div className="m-auto flex flex-col" style={{ width: widthInner }}>
                {children}
            </div>
        </div>
    )
}