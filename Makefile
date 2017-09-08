commit       := $(shell git rev-parse HEAD | cut -c1-8)
date         := $(shell date -I)
version-file := 'src/assets/json/version.json'

clean:
	rm -rf dist

pre-prod: clean
	echo "{\"version\": \"pre-prod-$(date)-$(commit)\"}" > $(version-file)
	npm run build-pre-prod
	git reset -- $(version-file)
deploy-pre-prod: pre-prod
	scp -r dist/* fa-gate-adm:/data/www/demo/francis/dist/test

prod: clean
	echo "{\"version\": \"prod-$(date)-$(commit)\"}" > $(version-file)
	npm run build-production
	git reset -- $(version-file)
deploy-prod: prod
	scp -r dist/* fa-gate-adm:/data/www/demo/francis/dist

cloud: clean
	echo "{\"version\": \"cloud-$(date)-$(commit)\"}" > $(version-file)
	node build/build.js cloud
	git reset -- $(version-file)
deploy-cloud: cloud
	scp -r dist/* cloud-mi:/var/www/html

sync-cloud-es:
	./sync_elastic_search.sh
