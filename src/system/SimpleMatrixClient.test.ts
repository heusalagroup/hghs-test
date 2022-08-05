/**
 * System test for SimpleMatrixClient at fi.hg.matrix module.
 *
 * E.g. this test is meant to connect to the real Matrix.org server and test real
 * functionality.
 */

import { SimpleMatrixClient } from "../fi/hg/matrix/SimpleMatrixClient";
import { LogLevel } from "../fi/hg/core/types/LogLevel";
import { SimpleMatrixClientState } from "../fi/hg/matrix/types/SimpleMatrixClientState";
import { MatrixCreateRoomResponseDTO } from "../fi/hg/matrix/types/response/createRoom/MatrixCreateRoomResponseDTO";
import { MatrixCreateRoomPreset } from "../fi/hg/matrix/types/request/createRoom/types/MatrixCreateRoomPreset";
import { MatrixType } from "../fi/hg/matrix/types/core/MatrixType";
import { MatrixRoomCreateEventDTO } from "../fi/hg/matrix/types/event/roomCreate/MatrixRoomCreateEventDTO";
import { MatrixCreateRoomDTO } from "../fi/hg/matrix/types/request/createRoom/MatrixCreateRoomDTO";
import { MatrixStateEventOf } from "../fi/hg/matrix/types/core/MatrixStateEventOf";
import { createMatrixStateEvent } from "../fi/hg/matrix/types/core/MatrixStateEvent";
import { createRoomHistoryVisibilityStateEventDTO } from "../fi/hg/matrix/types/event/roomHistoryVisibility/RoomHistoryVisibilityStateEventDTO";
import { createRoomHistoryVisibilityStateContentDTO } from "../fi/hg/matrix/types/event/roomHistoryVisibility/RoomHistoryVisibilityStateContentDTO";
import { MatrixHistoryVisibility } from "../fi/hg/matrix/types/event/roomHistoryVisibility/MatrixHistoryVisibility";
import { createRoomGuestAccessStateEventDTO } from "../fi/hg/matrix/types/event/roomGuestAccess/RoomGuestAccessStateEventDTO";
import { createRoomGuestAccessContentDTO } from "../fi/hg/matrix/types/event/roomGuestAccess/RoomGuestAccessContentDTO";
import { MatrixGuestAccess } from "../fi/hg/matrix/types/event/roomGuestAccess/MatrixGuestAccess";
import { JsonObject } from "../fi/hg/core/Json";
import { GetRoomStateByTypeResponseDTO } from "../fi/hg/matrix/types/response/getRoomStateByType/GetRoomStateByTypeResponseDTO";
import { MatrixRoomJoinedMembersDTO } from "../fi/hg/matrix/types/response/roomJoinedMembers/MatrixRoomJoinedMembersDTO";
import { PutRoomStateWithEventTypeResponseDTO } from "../fi/hg/matrix/types/response/setRoomStateByType/PutRoomStateWithEventTypeResponseDTO";
import { SetRoomStateByTypeRequestDTO } from "../fi/hg/matrix/types/request/setRoomStateByType/SetRoomStateByTypeRequestDTO";
import { MatrixSyncResponseDTO } from "../fi/hg/matrix/types/response/sync/MatrixSyncResponseDTO";
import { MatrixRoomId } from "../fi/hg/matrix/types/core/MatrixRoomId";
import { filter, keys } from "../fi/hg/core/modules/lodash";

SimpleMatrixClient.setLogLevel(LogLevel.NONE);

const MATRIX_HS_USERNAME = process?.env?.MATRIX_HS_USERNAME ?? 'app';
const MATRIX_HS_USER_ID = process?.env?.MATRIX_HS_USER_ID ?? '@app:localhost';
const MATRIX_HS_PASSWORD = process?.env?.MATRIX_HS_PASSWORD ?? 'p4sSw0rd123';

const MATRIX_HS_USERNAME_2 = process?.env?.MATRIX_HS_USERNAME_2 ?? 'app2';
const MATRIX_HS_USER_ID_2 = process?.env?.MATRIX_HS_USER_ID_2 ?? '@app2:localhost';
const MATRIX_HS_PASSWORD_2 = process?.env?.MATRIX_HS_PASSWORD_2 ?? 'p4sSw0rd456';

const MATRIX_HS_URL = process?.env?.MATRIX_HS_URL ?? 'http://localhost:8008';
const MATRIX_HS_TEST_STATE_TYPE = "fi.hg.hs.test";
const MATRIX_HS_TEST_DELETED_STATE_TYPE = "fi.hg.hs.deleted.test";
const MATRIX_HS_TEST_STATE_KEY = "";

describe('system', () => {

    describe('SimpleMatrixClient', () => {

        describe('#construct', () => {

            it('can create unauthenticated client object', () => {
                const client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/3
         */
        describe('#login', () => {

            const client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeAll( () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
            });

            it('can login', async () => {

                await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/2
         */
        describe('#whoami', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can fetch the user id', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
                const userId = await client.whoami();
                expect(userId).toBe(MATRIX_HS_USER_ID);
                expect(client.getUserId()).toBe(MATRIX_HS_USER_ID);
            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/13
         */
        describe('#createRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can create room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                expect(response.room_id).toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/7
         */
        describe('#getRoomStateByType', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can get room state by type', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                const stateResponse : GetRoomStateByTypeResponseDTO | undefined = await client.getRoomStateByType(
                    roomId,
                    MATRIX_HS_TEST_STATE_TYPE,
                    MATRIX_HS_TEST_STATE_KEY
                );

                expect(stateResponse?.name).toBe(undefined);
                expect(stateResponse?.version).toBe(1);
                expect(stateResponse?.data?.hello).toBe("world");

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/8
         */
        describe('#setRoomStateByType', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can set room state by type', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                const newContent : SetRoomStateByTypeRequestDTO = {
                    // @ts-ignore
                    data    : {
                        "hello": "world2"
                    },
                    version : 2
                };

                const changeStateResponse : PutRoomStateWithEventTypeResponseDTO | undefined = await client.setRoomStateByType(
                    roomId,
                    MATRIX_HS_TEST_STATE_TYPE,
                    MATRIX_HS_TEST_STATE_KEY,
                    newContent
                );

                expect(changeStateResponse?.event_id).toBeDefined();

                const stateResponse : GetRoomStateByTypeResponseDTO | undefined = await client.getRoomStateByType(
                    roomId,
                    MATRIX_HS_TEST_STATE_TYPE,
                    MATRIX_HS_TEST_STATE_KEY
                );

                expect(stateResponse?.name).toBe(undefined);
                expect(stateResponse?.version).toBe(2);
                expect(stateResponse?.data?.hello).toBe("world2");

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/5
         */
        describe('#getJoinedMembers', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can get joined members', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);

                expect(dto?.joined).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID]).toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/10
         */
        describe('#leaveRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can leave a room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                await client.leaveRoom(roomId);

                // FIXME: Use another account to check that the user left
                // const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);
                // expect(dto?.joined).toBeDefined();
                // expect(dto?.joined[MATRIX_HS_USER_ID]).not.toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/9
         */
        describe('#forgetRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('can forget a room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                await client.leaveRoom(roomId);
                await client.forgetRoom(roomId);

                // FIXME: Verify that the room was forgot
                // const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);
                // expect(dto?.joined).toBeDefined();
                // expect(dto?.joined[MATRIX_HS_USER_ID]).not.toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/11
         */
        describe('#inviteToRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);
            let client2 : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {

                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                client2 = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client2.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client2 = await client2.login(MATRIX_HS_USERNAME_2, MATRIX_HS_PASSWORD_2);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

            });

            afterEach( async () => {
                client.destroy();
                client2.destroy();
            });

            it('can invite another user to a room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                await client.inviteToRoom(roomId, MATRIX_HS_USER_ID_2);

                // FIXME: Should verify that invitation was received

                await client2.joinRoom(roomId);

                const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);
                expect(dto?.joined).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID]).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID_2]).toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/14
         */
        describe('#joinRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);
            let client2 : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {

                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                client2 = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client2.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client2 = await client2.login(MATRIX_HS_USERNAME_2, MATRIX_HS_PASSWORD_2);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

            });

            afterEach( async () => {
                client.destroy();
                client2.destroy();
            });

            it('can join to a room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                await client.inviteToRoom(roomId, MATRIX_HS_USER_ID_2);

                await client2.joinRoom(roomId);

                const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);
                expect(dto?.joined).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID]).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID_2]).toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/14
         */
        describe('#isAlreadyInTheRoom', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {
                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
            });

            afterEach( async () => {
                client.destroy();
            });

            it('cannot join room again', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                try {
                    await client.joinRoom(roomId);
                } catch (err: any) {
                    expect(client.isAlreadyInTheRoom(err)).toBe(true);
                }

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/15
         */
        describe('#waitForEvents', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);
            let client2 : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {

                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                client2 = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client2.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client2 = await client2.login(MATRIX_HS_USERNAME_2, MATRIX_HS_PASSWORD_2);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

            });

            afterEach( async () => {
                client.destroy();
                client2.destroy();
            });

            it('can wait for event', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);
                expect(client2.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;

                expect(roomId).toBeDefined();

                const waitPromise : Promise<boolean> = client2.waitForEvents(
                    [
                        MATRIX_HS_TEST_STATE_TYPE
                    ], [
                        roomId
                    ],
                    30
                );

                await client.inviteToRoom(roomId, MATRIX_HS_USER_ID_2);

                const isNotTimeout : boolean = await waitPromise;

                expect(isNotTimeout).toBe(false);

                await client2.joinRoom(roomId);

                const dto : MatrixRoomJoinedMembersDTO | undefined = await client.getJoinedMembers(roomId);
                expect(dto?.joined).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID]).toBeDefined();
                expect(dto?.joined[MATRIX_HS_USER_ID_2]).toBeDefined();

            });

        });

        /**
         * @see https://github.com/heusalagroup/hghs/issues/15
         */
        describe('#sync', () => {

            let client : SimpleMatrixClient = new SimpleMatrixClient(MATRIX_HS_URL);

            beforeEach( async () => {

                client = new SimpleMatrixClient(MATRIX_HS_URL);
                expect(client.getState()).toBe(SimpleMatrixClientState.UNAUTHENTICATED);
                client = await client.login(MATRIX_HS_USERNAME, MATRIX_HS_PASSWORD);
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

            });

            afterEach( async () => {
                client.destroy();
            });

            it('can fetch list of events for room', async () => {
                expect(client.getState()).toBe(SimpleMatrixClientState.AUTHENTICATED);

                const creationContent : Partial<MatrixRoomCreateEventDTO> = {
                    [MatrixType.M_FEDERATE]: false
                };

                const content : JsonObject = {
                    data    : {
                        hello: "world"
                    },
                    version : 1
                };

                let initialState : readonly MatrixStateEventOf<any>[] = [

                    // Set our own state which indicates this is a special group for our CRUD item,
                    // including our CRUD item value.
                    createMatrixStateEvent(
                        MATRIX_HS_TEST_STATE_TYPE,
                        MATRIX_HS_TEST_STATE_KEY,
                        content
                    ),

                    // Allow visibility to older events
                    createRoomHistoryVisibilityStateEventDTO(
                        createRoomHistoryVisibilityStateContentDTO(
                            MatrixHistoryVisibility.SHARED
                        )
                    ),

                    // Disallow guest from joining
                    createRoomGuestAccessStateEventDTO(
                        createRoomGuestAccessContentDTO(MatrixGuestAccess.FORBIDDEN)
                    )

                ];

                const allowedEventsObject = {
                    [MATRIX_HS_TEST_STATE_TYPE]: 0,
                    [MATRIX_HS_TEST_DELETED_STATE_TYPE]: 0
                };

                const options : MatrixCreateRoomDTO = {
                    preset: MatrixCreateRoomPreset.PRIVATE_CHAT,
                    creation_content: creationContent,
                    initial_state: initialState,
                    room_version: "8",
                    power_level_content_override: {
                        events: allowedEventsObject
                    }
                };

                const response : MatrixCreateRoomResponseDTO = await client.createRoom(options);

                const roomId = response?.room_id;
                expect(roomId).toBeDefined();

                const syncOptions = {
                    filter: {
                        presence: {
                            limit: 0
                        },
                        account_data: {
                            limit: 0
                        },
                        room: {
                            account_data: {
                                limit: 0
                            },
                            ephemeral: {
                                limit: 0
                            },
                            timeline: {
                                limit: 0
                            },
                            state: {
                                limit: 1,
                                include_redundant_members: true,
                                types: [ MATRIX_HS_TEST_STATE_TYPE ],
                                not_types: [ MATRIX_HS_TEST_DELETED_STATE_TYPE ]
                            }
                        }
                    },
                    full_state: true
                };

                const syncResponse : MatrixSyncResponseDTO = await client.sync(syncOptions);

                const joinObject = syncResponse?.rooms?.join ?? {};
                const joinedRooms  : readonly MatrixRoomId[] = keys(joinObject);

                expect( joinedRooms ).toContain(roomId);

            });

        });

    });

});
