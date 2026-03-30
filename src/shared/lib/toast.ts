/**
 * Toast abstraction layer — wraps sileo.
 *
 * NEVER import `sileo` directly outside of this file.
 * If we swap the toast library, we only touch this file.
 *
 * Usage:
 *   import { toast } from '@/shared/lib/toast'
 *   toast.success({ title: 'Review saved' })
 *   toast.error({ title: 'Something went wrong', description: err.message })
 *   toast.promise(myPromise, { loading: ..., success: ..., error: ... })
 */
import { sileo } from 'sileo'
import type { SileoOptions } from 'sileo'

export type ToastOptions = Pick<
  SileoOptions,
  'title' | 'description' | 'duration' | 'button'
>

export type ToastPromiseOptions<T> = {
  loading: ToastOptions
  success: ToastOptions | ((data: T) => ToastOptions)
  error: ToastOptions | ((err: unknown) => ToastOptions)
}

// Internal — mirrors sileo's unexported SileoPromiseOptions shape
type InternalSileoPromiseOptions<T> = {
  loading: SileoOptions
  success: SileoOptions | ((data: T) => SileoOptions)
  error: SileoOptions | ((err: unknown) => SileoOptions)
}

function mapOptions(opts: ToastOptions): SileoOptions {
  return {
    title: opts.title,
    description: opts.description,
    duration: opts.duration,
    button: opts.button,
    position: 'bottom-right',
  }
}

export const toast = {
  success: (opts: ToastOptions) => sileo.success(mapOptions(opts)),
  error: (opts: ToastOptions) => sileo.error(mapOptions(opts)),
  warning: (opts: ToastOptions) => sileo.warning(mapOptions(opts)),
  info: (opts: ToastOptions) => sileo.info(mapOptions(opts)),

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: ToastPromiseOptions<T>,
  ): Promise<T> => {
    const sileoOpts: InternalSileoPromiseOptions<T> = {
      loading: mapOptions(opts.loading),
      success:
        typeof opts.success === 'function'
          ? (data: T) => mapOptions((opts.success as (d: T) => ToastOptions)(data))
          : mapOptions(opts.success),
      error:
        typeof opts.error === 'function'
          ? (err: unknown) => mapOptions((opts.error as (e: unknown) => ToastOptions)(err))
          : mapOptions(opts.error),
    }
    // sileo.promise accepts the compatible shape — cast needed because the type isn't exported
    return sileo.promise(promise, sileoOpts as Parameters<typeof sileo.promise<T>>[1])
  },

  dismiss: (id: string) => sileo.dismiss(id),
  clear: () => sileo.clear(),
} as const
