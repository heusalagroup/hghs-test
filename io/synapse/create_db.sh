#!/bin/sh
createdb --encoding=UTF8 --locale=C --template=template0 -U synapse -O synapse synapse_db
