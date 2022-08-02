# @heusalagroup/hghs-test

System tests for fi.hg.matrix and matrix servers including hghs.

### Install test software

```shell
git submodule update --init --recursive
npm install
```

### Start up containers (test subjects)

Select one of the servers for testing

#### HgHs

```shell
docker-compose up
```

#### Synapse

```shell
docker-compose -f docker-compose.synapse.yml up
```

When started for the first time, you must create a user for testing:

```shell
docker exec -it hghs-test-synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml --no-admin -u app -p p4sSw0rd123
```

#### Dendrite

```shell
docker-compose -f docker-compose.dendrite.yml up
```

When started for the first time, you must create a user for testing:

```shell
docker exec -it hghs-test-dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username app -password p4sSw0rd123
```

### Run system tests

```shell
npm test
```

### Troubleshooting

#### `connect ECONNREFUSED 127.0.0.1:8008`

The backend is not running at port 8008. Is docker services up?
