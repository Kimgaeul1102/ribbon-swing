import { createConfigStore } from '../../../shared/store/createConfigStore'
import { DEFAULT_FRAME } from '../config'

export const useFrameStore = createConfigStore(DEFAULT_FRAME)
