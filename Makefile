commit       := $(shell git rev-parse HEAD | cut -c1-8)
date         := $(shell date -I)
version-file := 'src/assets/json/version.json'

clean:
	sudo rm -rf dist

download:
ifeq ("$(wildcard esdata)","")
	mkdir -p esdata
endif
ifeq ("$(wildcard esdata/dev_cartav_1node.tar.gz.gpg)","")
	wget http://catalog.datalab.mi/s/resources/cartav-jeu-de-developpement-preindexe/20180320-080437/dev_cartav_1node.tar.gz.gpg.zip -O esdata/dev_cartav_1node.tar.gz.gpg
endif

decrypt: download
ifeq ("$(wildcard esdata/dev/nodes/0/)","")
	@echo unpacking sample data
	@cat esdata/dev_cartav_1node.tar.gz.gpg | gpg -q -d --batch --passphrase "*AH5xieZa!" | sudo tar xzf - -C esdata/
endif

dev: decrypt 
	docker-compose -f docker-compose-run-dev.yml up -d



dev-stop:
	docker-compose -f docker-compose-run-dev.yml down

pre-prod: clean
	echo "{\"version\": \"pre-prod-$(date)-$(commit)\"}" > $(version-file)
	#npm run build-pre-prod
	mkdir -p dist
	docker-compose -f docker-compose-build-preprod.yml up
	git reset -- $(version-file)

deploy-pre-prod: pre-prod
	scp -r dist/* fa-proxy-muserfi:/var/www/demo/francis/dist/test

prod: clean
	echo "{\"version\": \"prod-$(date)-$(commit)\"}" > $(version-file)
	# npm run build-production
	mkdir -p dist
	docker-compose -f docker-compose-build-production.yml up
	git reset -- $(version-file)
deploy-prod: prod
	scp -r dist/* fa-proxy-muserfi:/var/www/demo/francis/dist
test: 
	docker-compose -f docker-compose-run-production.yml up -d

cloud: clean
	echo "{\"version\": \"cloud-$(date)-$(commit)\"}" > $(version-file)
	node build/build.js cloud
	git reset -- $(version-file)
deploy-cloud: cloud
	scp -r dist/* cloud-mi:/var/www/html

sync-cloud-es:
	./sync_elastic_search.sh
