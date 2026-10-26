import { create } from 'zustand'

/** 앱별 설정(CONFIG) 저장소를 만드는 공통 틀. cfg 전체를 바꾸거나 일부만 patch */
export function createConfigStore<T extends object>(defaults: T) {
  return create<{ cfg: T; set: (patch: Partial<T>) => void; reset: () => void }>((set) => ({
    cfg: defaults,
    set: (patch) => set((s) => ({ cfg: { ...s.cfg, ...patch } })),
    reset: () => set({ cfg: defaults }),
  }))
}
