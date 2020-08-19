// @ts-ignore something is broken with @types/hapi__hapi
import { Plugin, Server, Request, ResponseToolkit } from "@hapi/hapi";
import { JolocomSDK, IJolocomSDKConfig } from '@jolocom/sdk'
import { JolocomWebServiceBase, JolocomWebServiceOptions } from '@jolocom/web-service-base'
import * as Boom from '@hapi/boom'

export class HapiJolocomWebService extends JolocomWebServiceBase {
  name = 'hapi-jolocom-web-service'
  multiple = true
  version = "1.0.0"
  // TODO: add hapi websocket to requirements
  //       but also make it disable-able??
  requirements = { node: "10" }

  extraRouteConfig?: object

  constructor(sdk: JolocomSDK, options: JolocomWebServiceOptions & { extraRouteConfig?: object }) {
    super(sdk, options)
    this.extraRouteConfig = options.extraRouteConfig
  }

  async register(server: Server) {
    this.basePath =
      server.realm.modifiers &&
      server.realm.modifiers.route &&
      server.realm.modifiers.route.prefix ||
      ''

    /**
     * Route handler for SSI agents making POST callbacks for interactions
     */
    server.route({
      path: `${this.paths.interxn}/{cbID}`,
      method: 'POST',
      config: {
        ...this.extraRouteConfig
      },
      handler: async (
        request: Request,
        h: ResponseToolkit
      ) => {
        return this.processCallback(request.params.cbID, request.payload)
      }
    })

    /**
     * Route handler for SSI capable agents that want to establish a channel
     */
    server.route({
      path: this.paths.chan,
      method: 'POST',
      config: {
        ...this.extraRouteConfig,
        plugins: {
          websocket: {
            only: true,
              /*disconnect: ({ ctx }) => {
                // TODO set a timeout to clear the open channel from memory
              }*/
          }
        }
      },
      handler: async (
        request: Request,
        h: ResponseToolkit
      ) => {
        let { initially, ws, ctx } = request.websocket()
        if (!ctx.chan) {
          try {
            ctx.chan = await this.sdk.channels.findByJWT(request.payload)
            ctx.chan.transportAPI = {
              send: ws.send.bind(ws)
            }
          } catch (err) {
            console.error('while creating websockets channel', err)
            console.log(request.payload)
            return Boom.internal(err.toString())
          }
        }

        try {
          ctx.chan.processJWT(request.payload)
        } catch (err) {
          console.error('while processing SSI message:', request.payload, 'error:', err)
          return Boom.internal(err.toString())
        }

        // TODO return nothing without breaking hapi websockets??
        return ''
      }
    })


    /**
     * Route handler for non-SSI capable frontends.
     * This handles RPC calls over both http POST and websockets
     *
     */
    server.route({
      path: this.paths.rpc,
      method: 'POST',
      config: {
        ...this.extraRouteConfig,

        payload: { output: "data", parse: true, allow: "application/json" },
        plugins: { websocket: true },
      },
      handler: async (
        request: Request,
        h: ResponseToolkit
      ) => {
        try {
          return this.processRPC(request.payload)
        } catch (err) {
          console.error('while processing RPC message:', request.payload, 'error:', err)
          return Boom.badRequest(err.toString())
        }
      }
    })
  }
}
