# Ember-cli-deploy-tenxun

This README outlines the details of collaborating on this Ember addon.


To get up and running quickly, do the following:

Ensure ember-cli-deploy-build is installed and configured.

Install this plugin

$ ember install ember-cli-deploy-tenxu

Place the following configuration into config/deploy.js
ENV.tenxu = {
  accessKeyId: '<your-oss-access-key>',
  secretAccessKey: '<your-oss-secret>',
  bucket: '<your-oss-bucket>'
}
Run the pipeline
$ ember deploy
