//shared
import { Card, HeadSubSec, TitleSubSec, BodySubSec} from '@/shared'
//features
import {FormMediciones} from '@/features';
//app
// import '../../globals.css'

export default function EvaluacionFisicaPage(){
    return(
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card widthInner='80%'>
                    <HeadSubSec>
                        <TitleSubSec title="Evaluación física"/>
                    </HeadSubSec>
                    <BodySubSec>
                        <FormMediciones/>
                    </BodySubSec>
                </Card>
            </div>
        </div>
    )
}
