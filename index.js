/* jshint node: true */
'use strict';

var BasePlugin = require('ember-cli-deploy-plugin');
var minimatch = require('minimatch');
var BasePlugin = require('ember-cli-deploy-plugin');
var Tenxun = require('./lib/tenxun');

module.exports = {
  name: 'ember-cli-deploy-tenxun',
  createDeployPlugin: function(options) {
  	var DeployPlugin = BasePlugin.extend({
      name: options.name,
      defaultConfig: {
        filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2}',
        prefix: '',
        acl: 'public-read',
        distDir: function(context) {
          return context.distDir;
        },
        distFiles: function(context) {
          return context.distFiles || [];
        },
        gzippedFiles: function(context) {
          return context.gzippedFiles || []; // e.g. from ember-cli-deploy-gzip
        },
        manifestPath: function(context) {
          return context.manifestPath; // e.g. from ember-cli-deploy-manifest
        },
        uploadClient: function(context) {
          return context.uploadClient; // if you want to provide your own upload client to be used instead of one from this addon
        },
        tenxuncosClient: function(context) {
          return context.tenxuncosClient; // if you want to provide your own Tenxun COS client to be used instead of one from tenxun-sdk
        }
      },
     
     requiredConfig: ['accessKeyId', 'secretAccessKey','accessBucket','accessAPPID', 'accessBucketName','accessRemoteFilePath'],
      upload: function(context) {
         var self          = this;
         var filePattern   = this.readConfig('filePattern');
         var distDir       = this.readConfig('distDir');
         var distFiles     = this.readConfig('distFiles');
         var gzippedFiles  = this.readConfig('gzippedFiles');
         var bucket        = this.readConfig('bucket');
         var acl           = this.readConfig('acl');
         var prefix        = this.readConfig('prefix');
         var manifestPath  = this.readConfig('manifestPath');

         var filesToUpload = distFiles.filter(minimatch.filter(filePattern, { matchBase: true }));

         var tenxun = this.readConfig('uploadClient') || new Tenxun({
           plugin: this
         });

         var options = {
           cwd: distDir,
           filePaths: filesToUpload,
           gzippedFilePaths: gzippedFiles,
           prefix: prefix,
           bucket: bucket,
           acl: acl,
           manifestPath: manifestPath
         };
         //准备上传文件到bucket
         this.log('preparing to upload to tenxun bucket `' + bucket + '`', { verbose: true });

         return tenxun.upload(options)
         .then(function(filesUploaded){
           self.log('uploaded ' + filesUploaded.length + ' files ok', { verbose: true });
           return { filesUploaded: filesUploaded };
         })
         .catch(this._errorMessage.bind(this));
        },
        _errorMessage: function(error) {
         this.log(error, { color: 'red' });
         if (error) {
           this.log(error.stack, { color: 'red' });
         }
         return Promise.reject(error);
      }
    });

    return new DeployPlugin();

  }
};
