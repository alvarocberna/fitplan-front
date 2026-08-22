
export function GeneralContainer(
  {children,}: Readonly<{children: React.ReactNode;}>
) {
  return (
    <div className="">
        {/* Sec Principal */}
        <div className="h-full pb-10 flex pt-24">
            <div className='w-[90%] sm:w-[80% md:w-[90%] lg:w-[80%] h-full mt-25 md:mt-8 mb-10 mx-auto' 
            // style={{border: '1px solid red'}}
            >
                {children}
            </div>
        </div>
    </div>
  )
}