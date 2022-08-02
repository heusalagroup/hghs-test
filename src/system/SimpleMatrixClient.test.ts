/**
 * System test for SimpleMatrixClient at fi.hg.matrix module.
 *
 * E.g. this test is meant to connect to the real Matrix.org server and test real
 * functionality.
 */

import { SimpleMatrixClient } from "../fi/hg/matrix/SimpleMatrixClient";
import { LogLevel } from "../fi/hg/core/types/LogLevel";
import { SimpleMatrixClientState } from "../fi/hg/matrix/types/SimpleMatrixClientState";

SimpleMatrixClient.setLogLevel(LogLevel.NONE);

const MATRIX_HS_USERNAME = 'app';
const MATRIX_HS_PASSWORD = 'p4sSw0rd123';
const MATRIX_HS_URL = 'http://localhost:8008';

describe('system', () => {

    describe('SimpleMatrixClient', () => {

        describe('construct', () => {

            it('can create unauthenticated client object', () => {
                const client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
            });

        });

        describe('login', () => {

            const client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeAll( () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
            });

            it('can login', async () => {

                await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);

            });

        });

    });

});
