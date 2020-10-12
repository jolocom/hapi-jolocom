"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_service_base_1 = require("@jolocom/web-service-base");
const Boom = __importStar(require("@hapi/boom"));
class HapiJolocomWebService extends web_service_base_1.JolocomWebServiceBase {
    constructor(agent, options) {
        super(agent, options);
        this.name = 'hapi-jolocom-web-service';
        this.multiple = true;
        this.version = "2.0.0";
        // TODO: add hapi websocket to requirements
        //       but also make it disable-able??
        this.requirements = {};
        this.extraRouteConfig = options.extraRouteConfig;
    }
    register(server) {
        return __awaiter(this, void 0, void 0, function* () {
            this.basePath =
                server.realm.modifiers &&
                    server.realm.modifiers.route &&
                    server.realm.modifiers.route.prefix ||
                    '';
            /**
             * Route handler for SSI agents making POST callbacks for interactions
             */
            server.route({
                path: `${this.paths.interxn}/{cbID}`,
                method: 'POST',
                config: Object.assign({}, this.extraRouteConfig),
                handler: (request, h) => __awaiter(this, void 0, void 0, function* () {
                    return this.processCallback(request.params.cbID, request.payload);
                })
            });
            /**
             * Route handler for SSI capable agents that want to establish a channel
             */
            server.route({
                path: this.paths.chan,
                method: 'POST',
                config: Object.assign(Object.assign({}, this.extraRouteConfig), { payload: { parse: false }, plugins: Object.assign(Object.assign({}, (this.extraRouteConfig && this.extraRouteConfig.plugins)), { websocket: {
                            only: true,
                        } }) }),
                handler: (request, h) => __awaiter(this, void 0, void 0, function* () {
                    let { initially, ws, ctx } = request.websocket();
                    const payload = request.payload && request.payload.toString();
                    if (!payload) {
                        console.error('channel handler got no payload', request.payload);
                        return Boom.internal('empty payload');
                    }
                    if (!ctx.chan) {
                        try {
                            ctx.chan = yield this.agent.channels.findByJWT(payload);
                            ctx.chan.transportAPI = {
                                send: ws.send.bind(ws)
                            };
                        }
                        catch (err) {
                            console.error('while creating websockets channel', payload, err);
                            return Boom.internal(err.toString());
                        }
                    }
                    try {
                        ctx.chan.processJWT(payload);
                    }
                    catch (err) {
                        console.error('while processing SSI message:', payload, 'error:', err);
                        return Boom.internal(err.toString());
                    }
                    // TODO return nothing without breaking hapi websockets??
                    return '';
                })
            });
            /**
             * Route handler for non-SSI capable frontends.
             * This handles RPC calls over both http POST and websockets
             *
             */
            server.route({
                path: this.paths.rpc,
                method: 'POST',
                config: Object.assign(Object.assign({}, this.extraRouteConfig), { payload: { output: "data", parse: true, allow: "application/json" }, plugins: { websocket: true } }),
                handler: (request, h) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return this.processRPC(request.payload);
                    }
                    catch (err) {
                        console.error('while processing RPC message:', request.payload, 'error:', err);
                        return Boom.badRequest(err.toString());
                    }
                })
            });
        });
    }
}
exports.HapiJolocomWebService = HapiJolocomWebService;
//# sourceMappingURL=index.js.map