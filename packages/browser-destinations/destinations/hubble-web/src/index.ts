import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import { Hubble } from './types'
import { defaultValues } from '@segment/actions-core'

import track from './track'
import identify from './identify'

declare global {
  interface Window {
    Hubble: Hubble
  }
}

export const destination: BrowserDestinationDefinition<Settings, Hubble> = {
  name: 'Hubble (actions)',
  slug: 'hubble-web',
  mode: 'device',

  presets: [
    {
      name: 'Identify user',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    }
  ],

  settings: {
    appID: {
      description: 'appID',
      label: 'appID',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    if (!window.Hubble) {
      /**
       * FIXME: Use production URL e.g. `https://sdk.hubble.team`
       */
      await deps.loadScript(`http://localhost:3002/sdk/${settings.appID}.js`)
      await deps.resolveWhen(() => window.Hubble?.initialized, 100)

      /**
       * FIXME: Consider exposing a `setSource` method if we intend to keep
       *        `_emitter` private. Or just remove underscore in `_emitter`
       */
      ;(window.Hubble as Hubble)._emitter?.setSource('__segment__')
    }

    return window.Hubble
  },

  actions: {
    track,
    identify
  }
}

export default browserDestination(destination)
