var CoreObject = require('core-object');
var Promise = require('ember-cli/lib/ext/promise');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var _ = require('lodash');

var EXPIRE_IN_2030 = new Date("2030");
var TWO_YEAR_CACHE_PERIOD_IN_SEC = 60 * 60 * 24 * 365 * 2;

module.exports = CoreObject.extend({
  init: function(options) {
    this._plugin = options.plugin;
    //安装TENXUN SDK
    var qcloud = require('qcloud_cos');
    //bucket创建参见创建Bucket - https://console.qcloud.com/cos
    //若需要支持 HTTPS 协议上传，则将 qcloud_cos/lib/conf.js 文件中变量 API_COS_END_POINT 中的http修改为 https 即可。
    if(this._plugin.readConfig('tenxuncosClient')){
      this._client = this._plugin.readConfig('tenxuncosClient');  
    }else{
      qcloud.conf.setAppInfo(this._plugin.readConfig('accessAPPID'),
        this._plugin.readConfig('accessKeyId'),
        this._plugin.readConfig('secretAccessKey')
        ); 
      // qcloud.auth.signOnce(this._plugin.readConfig('accessBucket'),    
      //       '/'+this._plugin.readConfig('accessAPPID')+'/'+this._plugin.readConfig('accessBucketName')+'/'+this._plugin.readConfig('accessRemoteFilePath'));
      this._client = qcloud.cos;
    }
    
        //
        //qcloud.cos.createFolder('bucketname', '/myFolder/', function(ret) {
            //deal with ret
        //});
  },

  upload: function(options) {
    options = options || {};
    return this._determineFilePaths(options).then(function(filePaths){
      return Promise.all(this._putObjects(filePaths, options));
    }.bind(this));
  },

  _determineFilePaths: function(options) {
    var plugin = this._plugin;
    var filePaths = options.filePaths || [];
    if (typeof filePaths === 'string') {
      filePaths = [filePaths];
    }
    var prefix       = options.prefix;
    var manifestPath = options.manifestPath;
    if (manifestPath) {
      var key = path.join(prefix, manifestPath);
      plugin.log('Downloading manifest for differential deploy from `' + key + '`...', { verbose: true });
      return new Promise(function(resolve, reject){
        var params = { Bucket: options.bucket, Key: key};
        this._client.getObject(params, function(error, data) {
          if (error) {
            reject(error);
          } else {
            resolve(data.Body.toString().split('\n'));
          }
        }.bind(this));
      }.bind(this)).then(function(manifestEntries){
        plugin.log("Manifest found. Differential deploy will be applied.", { verbose: true });
        return _.difference(filePaths, manifestEntries);
      }).catch(function(/* reason */){
        plugin.log("Manifest not found. Disabling differential deploy.", { color: 'yellow', verbose: true });
        return Promise.resolve(filePaths);
      });
    } else {
      return Promise.resolve(filePaths);
    }
  },

  _putObjects: function(filePaths, options) {
    var plugin           = this._plugin;
    var cwd              = options.cwd;
    var bucket           = options.bucket;
    var prefix           = options.prefix;
    var gzippedFilePaths = options.gzippedFilePaths || [];
    var cacheControl     = 'max-age='+TWO_YEAR_CACHE_PERIOD_IN_SEC+', public';
    var expires          = EXPIRE_IN_2030;

    var manifestPath = options.manifestPath;
    var pathsToUpload = filePaths;
    if (manifestPath) {
      pathsToUpload.push(manifestPath);
    }

    return pathsToUpload.map(function(filePath) {

      var basePath    = path.join(cwd, filePath);
      
      var contentType = mime.lookup(basePath);
      var dstpath     = filePath;
      
     

      return new Promise(function(resolve, reject) {
        //upload_slice 上次文件可以大于8M
        console.log("-> local file : "+basePath);
        console.log("-> dst path is : "+dstpath);
        console.log("-> bucket : "+bucket);
        this._client.upload(basePath,bucket,dstpath,0, function(error, data) {
          if (error) {
            console.log("error ",error);
            reject(error);
          } else {
            console.log("success ",data);
            plugin.log('✔  ' + key, { verbose: true });
            resolve(filePath);
          }
        });
      }.bind(this));
    }.bind(this));
  }
});