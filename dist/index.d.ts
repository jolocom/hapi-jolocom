import { Server } from "@hapi/hapi";
import { JolocomSDK } from '@jolocom/sdk';
import { JolocomWebServiceBase, JolocomWebServiceOptions } from '@jolocom/web-service-base';
export declare class HapiJolocomWebService extends JolocomWebServiceBase {
    name: string;
    multiple: boolean;
    version: string;
    requirements: {
        node: string;
    };
    extraRouteConfig?: object;
    constructor(sdk: JolocomSDK, options: JolocomWebServiceOptions & {
        extraRouteConfig?: object;
    });
    register(server: Server): Promise<void>;
}
