import { createConfigStore } from '../../../shared/store/createConfigStore'
import { DEFAULT_BOX } from '../config'

export const useBoxStore = createConfigStore(DEFAULT_BOX)
