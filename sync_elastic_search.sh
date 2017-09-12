#!/bin/bash

function create_tunnel() {
  echo "Opening SSH tunnels"
  ssh fa-gate-adm -fnNT -M -S datalab_socket -L 9202:datalab-host1:9202
  ssh cloud-mi-elastic-search -fnNT -M -S cloud-es_socket -L 9201:localhost:9200
}

function close_tunnel() {
  echo "Closing SSH tunnels"
  ssh datalab_socket -S datalab_socket -O exit
  ssh cloud-es_socket -S cloud-es_socket -O exit
}

function fail() {
  echo "Something went wrong"
  goodbye
  exit 1
}

function interrupt() {
  echo "Script interrupted by the user"
  goodbye
  exit 1
}

function goodbye() {
  echo "Exiting"
  close_tunnel
  echo "Bye!"
}

function sync_acc() {
  echo "Synchronizing accident analyzer"
  curl -XDELETE 'localhost:9201/es5_prod_accidents'
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_accidents \
  	--output=http://localhost:9201/es5_prod_accidents \
  	--type=analyzer|| fail

  echo "Synchronizing accident mapping"
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_accidents \
  	--output=http://localhost:9201/es5_prod_accidents  \
  	--type=mapping || fail

  echo "Synchronizing accident data"
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_accidents \
  	--output=http://localhost:9201/es5_prod_accidents || fail

  echo "Synchronizing accident usagers"
  curl -XDELETE 'localhost:9201/es5_prod_accidents_usagers'
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_accidents_usagers \
  	--output=http://localhost:9201/es5_prod_accidents_usagers || fail

  echo "Synchronizing accident vehicles"
  curl -XDELETE 'localhost:9201/es5_prod_accidents_vehicules'
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_accidents_vehicules \
  	--output=http://localhost:9202/es5_prod_accidents_vehicules || fail
}

function sync_pve() {
  echo "Synchronizing PVE analyzer"
  curl -XDELETE 'localhost:9201/es5_prod_pve'
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_pve \
  	--output=http://localhost:9201/es5_prod_pve \
  	--type=analyzer || fail

  echo "Synchronizing PVE mapping"
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_pve \
  	--output=http://localhost:9201/es5_prod_pve \
  	--type=mapping || fail

  echo "Synchronizing PVE data"
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_pve \
  	--output=http://localhost:9201/es5_prod_pve || fail

  echo "Synchronizing Radars"
  curl -XDELETE 'localhost:9201/es5_prod_equipements_radar'
  ./node_modules/.bin/elasticdump \
    --quiet \
  	--input=http://localhost:9202/es5_prod_equipements_radar \
  	--output=http://localhost:9201/es5_prod_equipements_radar || fail
}

function main() {
  trap interrupt 15
  create_tunnel
  sync_acc
  sync_pve
  goodbye
  exit 0
}

main
