clean:
	rm -r dist

pre-prod: clean
	npm run build-pre-prod
deploy-pre-prod: pre-prod
	scp -r dist/* fa-gate-adm:/data/www/demo/francis/dist/test

prod: clean
	npm run build-production
deploy-prod: prod
	scp -r dist/* fa-gate-adm:/data/www/demo/francis/dist
