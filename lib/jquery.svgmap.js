;(function($) {
    "use strict";
    
    $.svgmap = function(container, options) {
        var self = this,
            $container = $(container),
            settings = $.extend(true, {
                data: null,
                width: null,
                height: null,
                offset: {
                    x: 0,
                    y: 0
                },
                rotation: 0,
                scale: "auto",
                style: {
                    stroke: {
                        default: "#555",
                        hover:   "#555",
                        click:   "#555"
                    },
                    strokeWidth: {
                        default: 1.5,
                        hover:   1.5,
                        click:   1.5
                    },
                    fill: {
                        default: "#e7e7e7",
                        hover:   "#999",
                        click:   "#555"
                    }
                },
                callback: {
                    init:  $.noop,
                    hover: [$.noop, $.noop],
                    click: $.noop
                }
            }, options),
            paper = null,
            pathSet = null,
            _private = {
                init: function() {
                    if (!window.Raphael) {
                        console.error("Raphaël.js required.");
                        return;
                    }

                    var transformStr = "";

                    if (paper) {
                        paper.remove();
                    }

                    if (settings.width === null) {
                        settings.width = $container.width();
                    }

                    if (settings.height === null) {
                        settings.height = $container.height();
                    }

                    if (typeof settings.callback.hover == "function") {
                        settings.callback.hover = [settings.callback.hover, $.noop];
                    }

                    paper = Raphael($container[0], settings.width, settings.height);
                    paper.raphael.paper = paper;
                    paper.setViewBox(
                        settings.offset.x,
                        settings.offset.y,
                        settings.width,
                        settings.height,
                        true
                    );

                    paper.raphael.click(function(e) {
                        if (e.target === this.paper.canvas) {
                            eve("map.click");
                        }
                    });

                    eve.on("map.click", function() {
                        paper.forEach(function(path) {
                            var object = settings.data[path.ovjectCode];

                            path.attr(_private.getStyle("default"));
                        });

                        settings.callback.click.apply(self, arguments);
                    });

                    pathSet = paper.set();

                    if (settings.scale) {
                        var scale = settings.scale;

                        if (scale === "auto") {
                            var scale = settings.width / $container.width();
                        }

                        transformStr += "s" + scale + "," + scale + ",0,0";
                    }

                    if (settings.rotation) {
                        transformStr += "r" + settings.rotation + "," + settings.width / 2 + "," + settings.height / 2;
                    }

                    for (var x in settings.data) {
                        var object = settings.data[x],
                            path = [],
                            transformedPath = "",
                            pathObj = null
                        ;
                        
                        if (typeof(object) == "string") {
                            path.push(object.slice(0, -1));

                        } else {
                            for (var y in object) {
                                path.push(object[y].slice(0, -1));
                            }
                        }

                        transformedPath = Raphael.transformPath(path.join(), transformStr).toString();
                        pathObj = paper.path(transformedPath);
                        pathObj.objectCode = x;
                        pathObj.attr(_private.getStyle("default"));

                        pathSet.push(pathObj);
                    }

                    pathSet
                        .hover(
                            function() {
                                self.setHoveredObjects(this.objectCode, true);

                                settings.callback.hover[0].apply({
                                    code: this.objectCode,
                                    path: this
                                }, arguments);
                            },
                            function() {
                                self.setHoveredObjects(this.objectCode, false);

                                settings.callback.hover[1].apply({
                                    code: this.objectCode,
                                    path: this
                                }, arguments);
                            }
                        )
                        .click(function(e) {
                            eve("path.click", this, arguments);
                            e.stopPropagation();
                        })
                    ;

                    eve.on("path.click", function() {
                        self.setActiveObjects(this.objectCode);

                        settings.callback.click.apply({
                            code: this.objectCode,
                            path: this
                        }, arguments);
                    });

                    self.activeCodes = [];
                    self.hoveredCodes = [];

                    $container.data("svgmap", self);
                },
                getStyle: function(mode) {
                    return {
                        "stroke":       settings.style.stroke[mode],
                        "stroke-width": settings.style.strokeWidth[mode],
                        "fill":         settings.style.fill[mode]
                    };
                }
            }
        ;

        self.getObjects = function() {
            var objects = [];

            pathSet.forEach(function(path) {
                objects.push({
                    code: path.objectCode,
                    path: path
                });
            });

            return objects;
        };

        self.setActiveObjects = function(codes) {
            if (typeof codes === "string") {
                codes = [codes];
            }

            self.activeCodes = [];

            pathSet.forEach(function(path) {
                if (path.objectCode && $.inArray(path.objectCode, codes) > -1) {
                    path.attr(_private.getStyle("click"));
                    self.activeCodes.push(path.objectCode);

                } else {
                    path.attr(_private.getStyle("default"));
                }
            });
        };

        self.getActiveObjects = function() {
            var activeObjects = [];

            pathSet.forEach(function(path) {
                if ($.inArray(path.objectCode, self.activeCodes) > -1) {
                    activeObjects.push({
                        code: path.objectCode,
                        path: path
                    });
                }
            });

            return activeObjects;
        };

        self.setHoveredObjects = function(codes, hovered) {
            if (typeof codes === "string") {
                codes = [codes];
            }

            self.hoveredCodes = [];

            pathSet.forEach(function(path) {
                if ($.inArray(path.objectCode, self.activeCodes) == -1) {
                    if ($.inArray(path.objectCode, codes) > -1) {
                        path.attr(_private.getStyle(hovered ? "hover" : "default"));
                        
                        if (hovered) {
                            self.hoveredCodes.push(path.objectCode);
                        }

                    } else {
                        path.attr(_private.getStyle("default"));
                    }
                }

            });
        };

        self.getHoveredObjects = function() {
            var hoveredObjects = [];

            pathSet.forEach(function(path) {
                if ($.inArray(path.objectCode, self.hoveredCodes) > -1) {
                    hoveredObjects.push({
                        code: path.objectCode,
                        path: path
                    });
                }
            });

            return hoveredObjects;
        };

        self.destroy = function() {
            paper.remove();
            $container.removeData("svgmap");
        };

        var _init = function() {
                _private.init();
                settings.callback.init.apply(self, arguments);
            },
            _error = function() {
                console.error("No data specified.");
            }
        ;

        if (settings.data) {
            _init();

        } else if ($container.data("json")) {
            $.getJSON($container.data("json"))
                .done(_init)
                .fail(_error)
            ;

        } else {
            _error();
        }
    };

    $.fn.svgmap = function(options) {
        if (typeof options === "object") {
            return this.each(function() {
                var svgmap = $(this).data("svgmap");

                if (svgmap !== undefined) {
                    svgmap.destroy();
                }

                new $.svgmap(this, options);
            });

        } else {
            return $(this).data("svgmap");
        }
    };
})(jQuery);
