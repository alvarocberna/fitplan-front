//features - panel
import { getPanelSummaryAction, type ActionResult } from './panel.actions'
import { PanelSummaryDto } from '../dtos/panel-summary.dto'

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.message)
    return result.data
}

export class PanelService {

    public static async getSummary(): Promise<PanelSummaryDto> {
        return unwrap(await getPanelSummaryAction())
    }

}
