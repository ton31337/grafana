/**
 * main app level module
 */
define([
  'angular',
  'jquery',
  'lodash',
  'require',
  'config',
  'bootstrap',
  'angular-route',
  'angular-sanitize',
  'angular-strap',
  'angular-dragdrop',
  'extend-jquery',
  'bindonce',
],
function (angular, $, _, appLevelRequire) {

  "use strict";

  var app = angular.module('grafana', []);
  var pre_boot_modules = [];
  var register_fns = {};
  var apps_deps = [
    'ngRoute',
    'ngSanitize',
    '$strap.directives',
    'ang-drag-drop',
    'grafana',
    'pasvaz.bindonce'
  ];

  // This stores the grafana version number
  app.constant('grafanaVersion',"@grafanaVersion@");

  // Use this for cache busting partials
  app.constant('cacheBust',"cache-bust="+Date.now());

  /**
   * Tells the application to watch the module, once bootstraping has completed
   * the modules controller, service, etc. functions will be overwritten to register directly
   * with this application.
   * @param  {[type]} module [description]
   * @return {[type]}        [description]
   */
  app.useModule = function (module) {
    if (pre_boot_modules) {
      pre_boot_modules.push(module);
      apps_deps.push(module.name);
    } else {
      _.extend(module, register_fns);
    }
    return module;
  };

  app.config(function($locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {
    // this is how the internet told me to dynamically add modules :/
    register_fns.controller = $controllerProvider.register;
    register_fns.directive  = $compileProvider.directive;
    register_fns.factory    = $provide.factory;
    register_fns.service    = $provide.service;
    register_fns.filter     = $filterProvider.register;
  });



  var module_types = ['controllers', 'directives', 'factories', 'services', 'filters', 'routes'];

  _.each(module_types, function (type) {
    var module_name = 'grafana.'+type;
    // create the module
    app.useModule(angular.module(module_name, []));
  });

  var preBootRequires = [
    'services/all',
    'features/all',
    'controllers/all',
    'directives/all',
    'filters/all',
    'components/partials',
    'routes/all',
  ];

  app.boot = function() {
    require(preBootRequires, function () {

      // disable tool tip animation
      $.fn.tooltip.defaults.animation = false;

      // bootstrap the app
      angular
        .element(document)
        .ready(function() {
          angular.bootstrap(document, apps_deps)
            .invoke(['$rootScope', function ($rootScope) {
              _.each(pre_boot_modules, function (module) {
                _.extend(module, register_fns);
              });
              pre_boot_modules = false;

              $rootScope.requireContext = appLevelRequire;
              $rootScope.require = function (deps, fn) {
                var $scope = this;
                $scope.requireContext(deps, function () {
                  var deps = _.toArray(arguments);
                  // Check that this is a valid scope.
                  if($scope.$id) {
                    $scope.$apply(function () {
                      fn.apply($scope, deps);
                    });
                  }
                });
              };
            }]);
        });
    });
  };

  return app;
});
