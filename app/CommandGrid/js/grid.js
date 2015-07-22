(function () {
    'use strict';

    var app = angular.module('app', [
        'ng'
    ]);

    app.directive('primeGrid', function ($compile, $interpolate, $parse) {

        function interpolateElement($templateElement, selector) {
            var element = $templateElement.find(selector);
            var html = element.html();
            var interpolate = function () { };
            if (html) {
                interpolate = $interpolate(html);
                element.remove();
            }
            return interpolate;
        }

        function compileElement($templateElement, selector) {
            var element = $templateElement.find(selector);
            var linker = function () { };
            if (element.length > 0) {
                var html = element.get(0).outerHTML;
                if (html) {
                    linker = $compile(html);
                    element.remove();
                }
            }
            return linker;
        }

        function createColumn(column) {
            var th = $('<th/>');
            th.attr('style', column.style);
            th.html(column.title || column.template);
            if (column.hidden) th.hide();
            return th;
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {
                datasource: '&',
                pageSize: '='
            },
            compile: function ($templateElement, $templateAttributes) {

                var emptyResult = interpolateElement($templateElement, 'empty-grid');
                var columsLinker = compileElement($templateElement, 'columns');
                var detailTemplate = compileElement($templateElement, 'detail-template');

                var grid = $('<table />');
                var thead = $('<thead />');
                var tbody = $('<tbody />');

                grid.append(thead);
                grid.append(tbody);

                $templateElement.append(grid);

                var headerCommandHandlerInit = $parse($templateAttributes.headerHandler);

                return function ($scope, $element, $attributes) {

                    var headerCommandHandler = headerCommandHandlerInit($scope.$parent);
                    var dataScope = $scope.$new(true);
                    dataScope.data = $scope.datasource();
                    if (dataScope.data) {
                        columsLinker($scope);

                        var headrow = $('<tr/>');
                        var datarow = $('<tr ng-repeat="item in data" />');

                        [].forEach.call($scope.columns, function (column) {
                            headrow.append(createColumn(column));
                            var datacell = null;
                            if (column.template) {
                                datacell = $('<td/>').html(column.template);
                            } else {
                                datacell = $('<td/>').html('{{item.' + column.key + '}}');
                            }
                            if (column.hidden) datacell.hide();
                            datarow.append(datacell);
                        });

                        thead.append(headrow);
                        tbody.append($compile(datarow)(dataScope));

                        if (headerCommandHandler) {
                            thead.on('click', function (e) {
                                var event = e || window.event;
                                var target = event.target || event.srcElement;

                                headerCommandHandler.call(target, event);
                            });
                        }
                    }
                    else {
                        $element.append(emptyResult($scope));
                    }
                };
            }
        };
    });

    function GridColumn(data) {
        var _this = this;
        angular.extend(_this, data || {
            key: null,
            title: 'n/a',
            sortable: false,
            hidden: false,
            style: null,
            template: null
        });
    }

    app.directive('column', ['$compile', '$interpolate', function ($compile, $interpolate) {

        var columntypes = {
            'checkall': {
                title: null,
                sortable: false,
                hidden: false,
                template: '<input type="checkbox" name="rowSelect" />'
            },
            'checkrow': {
                sortable: false,
                hidden: false,
                template: '<input type="checkbox" name="rowSelect" />'
            }
        };
        return {
            restrict: 'E',
            link: function ($scope, $element, $attributes) {
                if ($scope.columns) {
                    var column = columntypes[$attributes.type];

                    $scope.columns.push(new GridColumn({
                        key: $attributes.key,
                        title: $attributes.title,
                        sortable: $attributes.sortable || false,
                        hidden: $attributes.hidden || false,
                        style: $attributes.style,
                        template: $element.html()
                    }));
                }
            }
        };
    }]);

    app.directive('columns', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            scope: false,
            compile: function ($templateElement, $templateAttributes) {

                var template = null;
                var templateLinker = $compile($templateElement.html());

                $templateElement.remove();

                return {
                    post: function ($scope, $element, attributes, controller) {
                        $scope.columns = [];
                        template = templateLinker($scope);
                    }
                };
            }
        };
    }]);

    app.directive(
        'pageSizing',
        function ($timeout) {
            return {
                restrict: 'E',
                template: '<span>' +
                          '   Show' +
                          '   <div class="btn-group">' +
                          '       <div class="btn-group">' +
                          '           <a aria-expanded="true" href="#" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
                          '              {{ pageSize }} <span class="caret"></span>' +
                          '           </a>' +
                          '           <ul class="dropdown-menu">' +
                          '               <li ng-repeat="value in values" ng-class="{ active: (value == pageSize) }" ng-click="select(value)"><a href="#">{{value}}</a></li>' +
                          '           </ul>' +
                          '       </div>' +
                          '   </div>' +
                          '    entries per page' +
                          '</span>',
                scope: {
                    pageSize: '=',
                    options: '@'
                },
                link: function ($scope, element, attributes) {
                    $scope.values = $scope.options.split(/[,;\b]/);
                    $scope.select = function (size) {
                        $timeout(function () {
                            $scope.pageSize = size;
                        }, 0);
                    };
                }
            };
        });

    app.directive('tacoPager', [
        'tacoGridService',
        function (tacoGridService) {
            return {
                priority: -400,
                restrict: 'E',
                replace: true,
                scope: {
                    paging: '=pagingModel'
                },
                template: '<ul class="pagination">' +
                          '   <li ng-show="paging.backEnabled"><a href="#" ng-click="paging.seek(1)"><span class="glyphicon glyphicon-backward"></span></a></li>' +
                          '   <li ng-show="paging.backEnabled"><a href="#" ng-click="paging.previousPage()"><span class="glyphicon glyphicon-chevron-left"></span></a></li>' +
                          '   <li ng-repeat="n in paging.range" ng-class="{active: (n === paging.page)}"><a href="#" ng-click="paging.seek(n)">{{n}}</a></li>' +
                          '   <li ng-show="paging.forwardEnabled"><a href="#" ng-click="paging.nextPage()"><span class="glyphicon glyphicon-chevron-right"></span></a></li>' +
                          '   <li ng-show="paging.forwardEnabled"><a href="#" ng-click="paging.seek(pagination.totalPages)"><span class="glyphicon glyphicon-forward"></span></a></li>' +
                          '</ul>',
                compile: function ($templateElement, $templateAttributes) {
                    return {
                        pre: function ($scope, $element, $attributes, tacoGrid) {
                            tacoGridService.initializeGrid($scope.paging);
                        },
                        post: function ($scope, $element, $attributes) {

                        }
                    };
                }
            };
        }
    ]);

    app.service('tacoGridService', ['$timeout', function ($timeout) {
        var rowProcessors = [];
        var service = {
            initializeGrid: function (pagination) {

                //service.defaultGridOptions(grid.options);
                var paginationModel = {
                    page: 1,
                    totalPages: 1,
                    getPage: function () {
                        return pagination.page;
                    },
                    getTotalPages: function () {
                        return pagination.totalPages;
                    },
                    nextPage: function () {
                        pagination.page++;
                        this.update();
                    },
                    previousPage: function () {
                        pagination.page = Math.max(1, pagination.page - 1);
                        this.update();
                    },
                    seek: function (page) {
                        if (!angular.isNumber(page) || page < 1) {
                            throw 'Invalid page number: ' + page;
                        }
                        pagination.page = page;
                        this.update();
                    },
                    forwardEnabled: false,
                    startPos: 1,
                    range: [],
                    endPos: 1,
                    backEnabled: false,
                    update: function () {
                        var _this = pagination;
                        $timeout(function () {
                            _this.forwardEnabled = pagination.totalPages > 9;

                            _this.startPos = Math.max(pagination.page - 4, 1);
                            _this.endPos = _this.forwardEnabled ? _this.startPos + 8 : pagination.totalPages;

                            _this.backEnabled = pagination.totalPages > 9 && _this.startPos > 1;

                            _this.range = [];
                            if (_this.startPos !== _this.endPos) {
                                for (var i = _this.startPos; i <= _this.endPos; i++)
                                    _this.range.push(i);
                            }
                        }, 0);
                    }
                };

                angular.extend(pagination, paginationModel);
                service.registerRowsProcessor(function (renderableRows) {
                    if (!pagination.enablePagination) {
                        return renderableRows;
                    }
                    // Should atleast be 1 page
                    pagination.totalPages = Math.max(1, Math.ceil(renderableRows.TotalRows / pagination.pageSize));

                    var firstRow = (pagination.page - 1) * pagination.pageSize;
                    if (firstRow >= renderableRows.TotalRows) {
                        pagination.page = pagination.totalPages;
                        firstRow = (pagination.page - 1) * pagination.pageSize;
                    }
                    renderableRows.Result = renderableRows.Result.slice(firstRow, firstRow + pagination.pageSize);

                    return renderableRows;
                });
                pagination.seek(pagination.page);
            },
            defaultGridOptions: function (gridOptions) {
                gridOptions.enablePagination = gridOptions.enablePagination !== false;
                gridOptions.pageSize = angular.isNumber(gridOptions.pageSize) ? gridOptions.pageSize : 20;
            },
            registerRowsProcessor: function (processor) {
                if (typeof processor === "function") {
                    rowProcessors.push(processor);
                }
            },
            getRowProcessors: function () {
                return rowProcessors.slice(0);
            },
            executeDataRowProcessors: function (data) {
                var processors = service.getRowProcessors();
                while (processors.length) {
                    data = (processors.shift())(data);
                }
                return data;
            }
        };
        return service;
    }]);

    function GridCommand(data) {
        var _this = this;
        angular.extend(_this, data || {});
    }
    GridCommand.prototype = {
        constructor: GridCommand,
        name: '',
        args: null,
        $element: null,
        cancel: false,
    };

    app.directive('commandHandler', function ($parse) {
        return {
            restrict: 'A',
            compile: function (tElement, tAttributes) {

                var handler = $parse(tAttributes.commandHandler);
                tAttributes.$set('commandHandler', null);

                return function ($scope, element, attributes) {

                    var commandHandler = handler($scope);

                    element.on('click', function (e) {

                        var event = e || window.event;
                        var target = event.target || event.srcElement;
                        var command = target.attributes.command;
                        var args = target.attributes['command-args'];

                        if (command !== undefined) {
                            var gridCommand = new GridCommand({
                                name: command.value,
                                args: !!args ? args.value : null,
                                $element: $(target),
                                $catchElement: element
                            });

                            commandHandler.call(target, gridCommand, event);

                            if (gridCommand.cancel === true) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    });
                };
            }
        };
    });

    app.directive("tacoModal", ['$interpolate', '$compile', function ($interpolate, $compile) {

        function compile(tElement, tAttributes) {

        }

        return {
            restrict: "E",
            template: '<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="{{ labelledby }}" aria-hidden="true">' +
                    '    <div class="modal-dialog modal-lg">' +
                    '        <div class="modal-content">' +
                    '            <div class="modal-header">' +
                    '                <h3 class="modal-title">{{ title }}</h3>' +
                    '            </div>' +
                    '            <div class="modal-body" ng-transclude>' +
                    '            </div>' +
                    '            <div class="modal-footer">' +
                    '                <button class="btn btn-primary" ng-click="ok()">OK</button>' +
                    '                <button class="btn btn-warning" data-dismiss="modal" ng-click="cancel()">Cancel</button>' +
                    '            </div>' +
                    '        </div>' +
                    '    </div>' +
                    '</div>',
            transclude: true,
            replace: true,
            scope: {
                title: '@',
                visible: '='
            },
            link: function ($scope, element, attrs) {

                $scope.updateModal = function (elm) {
                    if (!elm) elm = element;
                    if ($scope.visible)
                        $(elm).modal("show");
                    else
                        $(elm).modal("hide");
                };

                $scope.$watch('visible', function (newValue, oldValue) {
                    $scope.updateModal(attrs.$$element);
                });

                //Update the visible value when the dialog is closed through UI actions (Ok, cancel, etc.)
                $(element).bind("hide.bs.modal", function () {
                    //$parse(attrs.show).assign(scope, false);
                    $scope.visible = false;
                    if (!$scope.$$phase && !$scope.$root.$$phase)
                        $scope.$apply();
                });

                $scope.$on('$destroy', function () {
                    $(element).unbind("hide.bs.modal");
                });
            }

        };
    }]);

    app.factory('demoDataService', ['$document', function ($document) {
        //script type="application/json" id="sampleData">
        var dataTemplate = $document.find('#sampleData');
        var json = dataTemplate.text();
        var dataModel = JSON.parse(json);
        dataTemplate.remove();

        return {
            Result: dataModel,
            TotalRows: dataModel.length
        };
    }]);

    app.controller('boringController', ['$scope', 'demoDataService', 'tacoGridService', function ($scope, demoDataService, tacoGridService) {

        $scope.pagination = {
            enablePagination: true,
            pageSize: 5,
            enableDetailRow: false
        };
        $scope.settings = {
            visible: false,
            collapse: false
        };

        tacoGridService.initializeGrid($scope.pagination);
        $scope.data = tacoGridService.executeDataRowProcessors(demoDataService);

        this.headerClicked = function (event) {
            var table = $(this).closest('table');
            var checked = this.checked;
            $('tbody tr>td:first-child input[type=checkbox]', table)
                .each(function (index, element) {
                    element.checked = checked;
                });
        };

        this.commandTrigger = function (command) {
            console.log(command.args);
            if (command.name === 'checkall') {
            }
        };

        this.panelcommand = function (command) {
            if (command.name === 'minimize') {
                command.$element.toggleClass('closed');
                $scope.settings.collapse = !$scope.settings.collapse;
                $scope.$apply();
            }
            if (command.name === 'settings') {
                $scope.settings.visible = true;
                $scope.$apply();
            }
            console.log(command);
        };
    }]);

})();