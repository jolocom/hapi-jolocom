import { Server } from "@hapi/hapi";
import { Agent } from '@jolocom/sdk';
import { JolocomWebServiceBase, JolocomWebServiceOptions } from '@jolocom/web-service-base';
export declare class HapiJolocomWebService extends JolocomWebServiceBase {
    name: string;
    multiple: boolean;
    version: string;
    requirements: {};
    extraRouteConfig?: object;
    constructor(agent: Agent, options: JolocomWebServiceOptions & {
        extraRouteConfig?: object;
    });
    register(server: Server): Promise<void>;
}
