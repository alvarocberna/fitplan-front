//features
import { PanelSummary, PanelService } from '@/features'

export default async function PanelPage() {
    const summary = await PanelService.getSummary()

    return (
        <div className="max-w-3xl mx-auto px-4">
            <PanelSummary summary={summary} />
        </div>
    )
}
