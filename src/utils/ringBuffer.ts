/** delay용 각도 기록 버퍼 — 고정 크기, 가장 오래된 값부터 덮어씀 */
export class RingBuffer {
  private times: Float64Array
  private values: Float64Array
  private head = 0
  private size = 0

  constructor(private capacity = 64) {
    this.times = new Float64Array(capacity)
    this.values = new Float64Array(capacity)
  }

  push(time: number, value: number): void {
    this.times[this.head] = time
    this.values[this.head] = value
    this.head = (this.head + 1) % this.capacity
    this.size = Math.min(this.size + 1, this.capacity)
  }

  /** time 이하 중 가장 최근 값. 기록이 부족하면 가장 오래된 값, 비었으면 0 */
  sampleAt(time: number): number {
    if (this.size === 0) return 0
    let oldest = this.values[(this.head - this.size + this.capacity) % this.capacity]
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.capacity) % this.capacity
      if (this.times[idx] <= time) return this.values[idx]
      oldest = this.values[idx]
    }
    return oldest
  }

  clear(): void {
    this.head = 0
    this.size = 0
  }
}
