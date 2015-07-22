(function () {
    'use strict';

    var _ = self.Life = function (seed) {
        this.seed = seed;
        this.height = seed.length;
        this.width = seed[0].length;

        this.prevBoard = [];
        this.board = clone2DArray(seed);
    };

    _.prototype = {
        next: function () {
            this.prevBoard = clone2DArray(this.board);

            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var neighbors = this.aliveNeighbors(this.prevBoard, x, y);
                    //console.log(y, x, ': ', neighbors);

                    var alive = !!this.board[y][x];
                    if (alive) {
                        if (neighbors < 2 || neighbors > 3) {
                            this.board[y][x] = 0;
                        }
                    }
                    else {
                        if (neighbors == 3) {
                            this.board[y][x] = 1;
                        }
                    }
                }
            }
        },

        aliveNeighbors: function (array, x, y) {
            var sum = 0;
            var prevRow = array[y - 1] || [];
            var nextRow = array[y + 1] || [];

            return [
                prevRow[x - 1], prevRow[x], prevRow[x + 1],
                array[y][x - 1], array[y][x + 1],
                nextRow[x - 1], nextRow[x], nextRow[x + 1],
            ].reduce(function (prev, cur) {
                return prev + +!!cur;
            }, 0);

            return sum;
        },

        toString: function () {
            return this.board.map(function (row) { return row.join(' '); }).join('\n');
        }
    };

    function clone2DArray(array) {
        return array.slice().map(function (row) { return row.slice(); });
    }
})();

//var game = new Life([
//    [0, 0, 0, 0, 0],
//    [0, 0, 1, 0, 0],
//    [0, 0, 1, 0, 0],
//    [0, 0, 1, 0, 0],
//    [0, 0, 0, 0, 0],
//]);

//console.log(game.toString());
//game.next();
//console.log(game.toString());
//game.next();
//console.log(game.toString());
//game.next();
//console.log(game.toString());

(function () {

    var _ = self.LifeView = function (table, size) {
        this.grid = table;
        this.size = size;
        this.started = false;
        this.autoplay = false;

        this.createGrid();
    };

    _.prototype = {
        createGrid: function () {
            var _this = this;
            var fragment = document.createDocumentFragment();
            this.grid.innerHtml = '';
            this.checkboxes = [];

            for (var y = 0; y < this.size; y++) {
                var row = document.createElement('tr');
                this.checkboxes[y] = [];

                for (var x = 0; x < this.size; x++) {
                    var cell = document.createElement('td');
                    var checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    this.checkboxes[y][x] = checkbox;
                    checkbox.coords = { 'x': x, 'y': y };

                    cell.appendChild(checkbox);
                    row.appendChild(cell);
                }
                fragment.appendChild(row);
            }

            this.grid.addEventListener('change', function (evt) {
                if (evt.target.nodeName.toLowerCase() === 'input') {
                    _this.started = false;
                }
            });

            this.grid.addEventListener('keyup', function (evt) {
                var checkbos = evt.target;
                if (checkbox.nodeName.toLowerCase() === 'input') {
                    var coords = checkbos.coords;

                    console.log(evt.keyCode);

                    switch (evt.keyCode) {
                        case 37: // left
                            if (coords.x > 0)
                                _this.checkboxes[coords.y][coords.x - 1].focus();
                            break;
                        case 38: // up
                            if (coords.y > 0)
                                _this.checkboxes[coords.y - 1][coords.x].focus();
                            break;
                        case 39: // right
                            if (coords.x < _this.size - 1)
                                _this.checkboxes[coords.y][coords.x + 1].focus();
                            break;
                        case 40: // bottom
                            if (coords.y < _this.size - 1)
                                _this.checkboxes[coords.y + 1][coords.x].focus();
                            break;
                    }
                }
            });

            this.grid.appendChild(fragment);
        },

        get boardArray() {
            return this.checkboxes.map(function (row) {
                return row.map(function (checkbox) {
                    return +checkbox.checked;
                })
            })
        },

        play: function () {
            this.game = new Life(this.boardArray);
            this.started = true;
        },

        next: function () {
            var _this = this;

            if (!this.started || this.game) {
                this.play();
            }

            this.game.next();

            var board = this.game.board;

            for (var y = 0; y < this.size; y++) {
                for (var x = 0; x < this.size; x++) {
                    this.checkboxes[y][x].checked = !!board[y][x];
                }
            }

            if (this.autoplay) {
                this.timer = setTimeout(function () {
                    _this.next();
                }, 500);
            }
        }
    };
})();

