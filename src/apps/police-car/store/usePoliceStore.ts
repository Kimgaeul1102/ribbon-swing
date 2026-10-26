import { createConfigStore } from '../../../shared/store/createConfigStore'
import { DEFAULT_POLICE } from '../config'

export const usePoliceStore = createConfigStore(DEFAULT_POLICE)
