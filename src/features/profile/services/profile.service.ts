//features - profile
import {
    getUserProfileAction,
    updateUserProfileAction,
} from './profile.actions'
//shared
import { unwrap } from '@/shared/api/unwrap'
import { UserProfileDto, UpdateUserProfileDto } from '../dtos/user-profile.dto'

export class ProfileService {

    public static async getProfile(): Promise<UserProfileDto> {
        return unwrap(await getUserProfileAction())
    }

    public static async updateProfile(data: UpdateUserProfileDto): Promise<UserProfileDto> {
        return unwrap(await updateUserProfileAction(data))
    }

}
