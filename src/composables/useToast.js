/**
 * @file Reactive toast notification system.
 *
 * Usage:
 *   import { toast } from '@/composables/useToast.js'
 *   toast.success('保存成功')
 *   toast.error('操作失败', 5000)  // stays 5s instead of default 3s
 *   toast.warning('请注意')
 *   toast.info('正在加载...')
 */

import { ref } from 'vue'

/** @type {import('vue').Ref<Array<{id:number, message:string, type:string}>>} */
const queue = ref([])
let nextId = 0
const MAX_TOASTS = 3
const DEFAULT_DURATION = 3500

/** Remove a toast by id with slide-out animation. */
function remove(id) {
  queue.value = queue.value.filter((t) => t.id !== id)
}

function add(message, type, duration = DEFAULT_DURATION) {
  const id = ++nextId
  queue.value = [...queue.value.slice(-(MAX_TOASTS - 1)), { id, message, type }]
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  return id
}

export const toast = {
  queue,
  remove,
  success(msg, dur) { return add(msg, 'success', dur) },
  error(msg, dur) { return add(msg, 'error', dur || 5000) },
  warning(msg, dur) { return add(msg, 'warning', dur || 4000) },
  info(msg, dur) { return add(msg, 'info', dur) },
}
