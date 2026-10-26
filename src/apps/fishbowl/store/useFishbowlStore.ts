import { createConfigStore } from '../../../shared/store/createConfigStore'
import { DEFAULT_FISHBOWL } from '../config'

export const useFishbowlStore = createConfigStore(DEFAULT_FISHBOWL)
