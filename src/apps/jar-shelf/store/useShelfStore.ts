import { createConfigStore } from '../../../shared/store/createConfigStore'
import { DEFAULT_SHELF } from '../config'

export const useShelfStore = createConfigStore(DEFAULT_SHELF)
