//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody} from '@/shared'
//features
import {FormMeasurements} from '@/features';
//app
// import '../../globals.css'

export default function PhysicalAssessmentPage(){
    return(
        <div className='w-full py-4'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card widthInner='80%' variant='solid'>
                    <SubsectionHead>
                        <SubsectionTitle title="Evaluación física"/>
                    </SubsectionHead>
                    <SubsectionBody>
                        <FormMeasurements/>
                    </SubsectionBody>
                </Card>
            </div>
        </div>
    )
}
