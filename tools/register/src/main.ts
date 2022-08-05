// Copyright (c) 2022. Heusala Group <info@heusalagroup.fi>. All rights reserved.

import { ProcessUtils } from "./fi/hg/core/ProcessUtils";
import { COMMAND_NAME, LOG_LEVEL } from "./constants/runtime";
import { LogService } from "./fi/hg/core/LogService";
import { LogLevel } from "./fi/hg/core/types/LogLevel";
import { CommandExitStatus } from "./fi/hg/core/cmd/types/CommandExitStatus";
import { RequestClient } from "./fi/hg/core/RequestClient";
import { CommandArgumentUtils } from "./fi/hg/core/cmd/utils/CommandArgumentUtils";
import { ParsedCommandArgumentStatus } from "./fi/hg/core/cmd/types/ParsedCommandArgumentStatus";
import { Headers } from "./fi/hg/core/request/Headers";
import { BUILD_USAGE_URL, BUILD_WITH_FULL_USAGE } from "./constants/build";
import { SimpleMatrixClient } from "./fi/hg/matrix/SimpleMatrixClient";
import { MatrixRegisterRequestDTO } from "./fi/hg/matrix/types/request/register/MatrixRegisterRequestDTO";
import { MatrixRegisterResponseDTO } from "./fi/hg/matrix/types/response/register/MatrixRegisterResponseDTO";
import { MatrixRegisterKind } from "./fi/hg/matrix/types/request/register/types/MatrixRegisterKind";

// Must be first import to define environment variables before anything else
ProcessUtils.initEnvFromDefaultFiles();

LogService.setLogLevel(LOG_LEVEL);

const LOG = LogService.createLogger('main');

export async function main (
    args: string[] = []
) : Promise<CommandExitStatus> {

    try {

        Headers.setLogLevel(LogLevel.INFO);
        RequestClient.setLogLevel(LogLevel.INFO);

        LOG.debug(`Loglevel as ${LogService.getLogLevelString()}`);

        const {scriptName, parseStatus, exitStatus, errorString, freeArgs} = CommandArgumentUtils.parseArguments(COMMAND_NAME, args);

        if ( parseStatus === ParsedCommandArgumentStatus.HELP || parseStatus === ParsedCommandArgumentStatus.VERSION ) {
            console.log(getMainUsage(scriptName));
            return exitStatus;
        }

        if (errorString) {
            console.error(`ERROR: ${errorString}`);
            return exitStatus;
        }

        ProcessUtils.setupDestroyHandler( () => {

            LOG.debug('Stopping command from process utils event');

        }, (err : any) => {
            LOG.error('Error while shutting down the service: ', err);
        });

        const matrixUrl : string | undefined = freeArgs.shift();
        const username : string | undefined = freeArgs.shift();
        const password : string | undefined = freeArgs.shift();

        if ( !matrixUrl || !username || !password ) {
            console.log(getMainUsage(scriptName));
            return CommandExitStatus.UNKNOWN_ARGUMENT;
        }

        const client : SimpleMatrixClient = new SimpleMatrixClient(matrixUrl);

        const body : MatrixRegisterRequestDTO = {
            username,
            password
        };

        const response : MatrixRegisterResponseDTO = await client.register(
            body,
            MatrixRegisterKind.USER
        );

        console.info(`Created user: ${response?.user_id}`);

        return CommandExitStatus.OK;

    } catch (err) {
        LOG.error(`Fatal error: `, err);
        return CommandExitStatus.FATAL_ERROR;
    }

}

/**
 *
 * @param scriptName
 * @nosideeffects
 * @__PURE__
 */
export function getMainUsage (
    scriptName: string
): string {

    /* @__PURE__ */if ( /* @__PURE__ */BUILD_WITH_FULL_USAGE ) {

        return `USAGE: ${/* @__PURE__ */scriptName} [OPT(s)] HOMESERVER USER PASSWORD

  ORGANISATION-NAME command.
  
...and OPT is one of:

    -h --help          Print help
    -v --version       Print version
    --                 Disables option parsing

  Environment variables:

    LOG_LEVEL as one of:
    
      ALL
      DEBUG
      INFO
      WARN
      ERROR
      NONE
`;
    } else {
        return `USAGE: ${/* @__PURE__ */scriptName} ARG(1) [...ARG(N)]
See ${/* @__PURE__ */BUILD_USAGE_URL}
`;
    }
}
