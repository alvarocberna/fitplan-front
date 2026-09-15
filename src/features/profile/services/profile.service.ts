//features - profile
import {
    getUserProfileAction,
    updateUserProfileAction,
    type ActionResult,
} from './profile.actions'
import { UserProfileDto, UpdateUserProfileDto } from '../dtos/user-profile.dto'

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.message)
    return result.data
}

export class ProfileService {

    public static async getProfile(): Promise<UserProfileDto> {
        return unwrap(await getUserProfileAction())
    }

    public static async updateProfile(data: UpdateUserProfileDto): Promise<UserProfileDto> {
        return unwrap(await updateUserProfileAction(data))
    }

}
