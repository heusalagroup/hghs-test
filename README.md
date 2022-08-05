# System tests for our Matrix software

These tests will be used as a specification what we'll implement next in 
[hghs](https://github.com/heusalagroup/hghs) 
and will eventually be system tests for our software:

 * [`hghs`](https://github.com/heusalagroup/hghs) Matrix.org server
 * [`SimpleMatrixClient`](https://github.com/heusalagroup/fi.hg.matrix/blob/main/SimpleMatrixClient.ts) lightweight, zero dep Matrix client
 * [`MatrixCrudRepository`](https://github.com/heusalagroup/fi.hg.matrix/blob/main/MatrixCrudRepository.ts) CRUD repository implementation

### Install test software

```shell
git clone git@github.com:hangovergames/hghs-test.git hghs-test
cd hghs-test
git submodule update --init --recursive
npm install
```

### Start up containers (test subjects)

Select one of the servers for testing.

***WARNING!*** **Our docker configurations are not secure enough to be deployed 
in the public. These are intended to be used for local temporary testing only.**

#### HgHs server

```shell
docker-compose up
```

Our `hghs` is far from fully functioning Matrix server and probably will never 
be. It is under test driven development. 


#### Synapse server

```shell
docker-compose -f docker-compose.synapse.yml up
```

When started for the first time, you must create a user for testing:

```shell
docker exec -it hghs-test-synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml --no-admin -u app -p p4sSw0rd123
docker exec -it hghs-test-synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml --no-admin -u app2 -p p4sSw0rd456
```

#### Dendrite server

```shell
docker-compose -f docker-compose.dendrite.yml up
```

When started for the first time, you must create a user for testing:

```shell
docker exec -it hghs-test-dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username app -password p4sSw0rd123
docker exec -it hghs-test-dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username app2 -password p4sSw0rd456
```

#### Other servers

You can run the test suite against any Matrix server.

Just start the server running at `http://localhost:8008` with a user `app` and password `p4sSw0rd123`.

You can also change these settings using following environment variables:

| Environment variable   | Default value           |
| ---------------------- | ----------------------- |
| `MATRIX_HS_URL`        | `http://localhost:8008` |
| `MATRIX_HS_USERNAME`   | `app`                   |
| `MATRIX_HS_USER_ID`    | `@app:localhost`        |
| `MATRIX_HS_PASSWORD`   | `p4sSw0rd123`           |
| `MATRIX_HS_USERNAME_2` | `app2`                  |
| `MATRIX_HS_USER_IDE_2` | `@app2:localhost`       |
| `MATRIX_HS_PASSWORD_2` | `p4sSw0rd456`           |

### Run system tests

```shell
npm test
```

### Troubleshooting

#### `connect ECONNREFUSED 127.0.0.1:8008`

The backend is not running at port 8008. Is docker services up?
