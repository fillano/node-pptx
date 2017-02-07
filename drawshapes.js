(function(window, undefined) {
    window.drawShapes = {
        'cust': function(ctx, shape, emu2pixel) {
            shape.presetGeom.pathList.forEach(function(path) {
                var gd = new Guides(ctx, shape.cx, shape.cy, function(x){return emu2pixel(x) * (shape.cx>shape.cy?shape.cy:shape.cx) / (shape.cx>shape.cy?path.h:path.w)});
                gd.begin();
                path.actions.forEach(function(action) {
                    if(!!gd[action.name] && typeof gd[action.name] === 'function') {
                        var args = action.pts.reduce(function(pre, cur) {
                            pre.push(cur.x);
                            pre.push(cur.y);
                            return pre;
                        }, []);
                        gd[action.name].apply(gd, args);
                    } else {
                        throw "[drawShapes] Action not supported.";
                    }
                });
                gd.close();
            });
        },
        'rect': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);
            gd.moveTo(gd.l, gd.t);
            gd.begin();
            gd.lineTo(gd.r, gd.t);
            gd.lineTo(gd.r, gd.b);
            gd.lineTo(gd.l, gd.b);
            gd.lineTo(gd.l, gd.t);
            gd.close();
        },
        'downArrow': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);
            shape.presetGeom.avList.forEach(function(a) {
                gd.addFormula(a.name, a.fmla);
            })
            gd.addFormula('maxAdj2', '*/ 100000 h ss');
            gd.addFormula('a1', 'pin 0 adj1 100000');
            gd.addFormula('a2', 'pin 0 adj2 maxAdj2');
            gd.addFormula('dy1', '*/ ss a2 100000');
            gd.addFormula('y1', '+- b 0 dy1');
            gd.addFormula('dx1', '*/ w a1 200000');
            gd.addFormula('x1', '+- hc 0 dx1');
            gd.addFormula('x2', '+- hc dx1 0');
            gd.addFormula('dy2', '*/ x1 dy1 wd2');
            gd.addFormula('y2', '+- y1 dy2 0');

            gd.moveTo(gd.l, gd.y1);
            gd.begin();
            gd.lineTo(gd.x1, gd.y1);
            gd.lineTo(gd.x1, gd.t);
            gd.lineTo(gd.x2, gd.t);
            gd.lineTo(gd.x2, gd.y1);
            gd.lineTo(gd.r, gd.y1);
            gd.lineTo(gd.hc, gd.b);
            gd.lineTo(gd.l, gd.y1);
            gd.close();
        },
        'line': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);

            if(!!shape.line && !!shape.line.w) {
                gd.addFormula('adj', 'val ' + (shape.line.w));
                gd.addFormula('a1', '*/ adj 3 2');
                gd.addFormula('a2', '*/ adj 2 3');
                if(!!shape.line.headEnd) {
                    switch(shape.line.headEnd) {
                        case 'triangle':
                            if(shape.cx > shape.cy) {
                                gd.addFormula('tx1', '+- l a1 0');
                                gd.addFormula('ty2', '+- t 0 a2');
                                gd.addFormula('ty4', '+- t a2 0');
                            } else {
                                gd.addFormula('ty1', '+- t a1 0');
                                gd.addFormula('tx2', '+- l a2 0');
                                gd.addFormula('tx4', '+- l 0 a2');
                            }
                            break;
                    }
                }
                if(!!shape.line.tailEnd) {
                    switch(shape.line.tailEnd) {
                        case 'triangle':
                            if(shape.cx > shape.cy) {
                                gd.addFormula('tx6', '+- r 0 a1');
                                gd.addFormula('ty7', '+- b a2 0');
                                gd.addFormula('ty9', '+- b 0 a2');
                            } else {
                                gd.addFormula('ty6', '+- b 0 a1');
                                gd.addFormula('tx7', '+- r a2 0');
                                gd.addFormula('tx9', '+- r 0 a2');
                            }
                            break;
                    }
                }
            }
            if(!!shape.line && !!shape.line.w && !!shape.line.headEnd) {
                switch(shape.line.headEnd) {
                    case 'triangle':
                        if(shape.cx > shape.cy) {
                            gd.moveTo(gd.tx1, gd.t);
                        } else {
                            gd.moveTo(gd.l, gd.ty1);
                        }
                        break;
                }
            } else {
                gd.moveTo(gd.l, gd.t);
            }
            gd.begin();
            if(!!shape.line && !!shape.line.w && !!shape.line.headEnd) {
                switch(shape.line.headEnd) {
                    case 'triangle':
                        if(shape.cx > shape.cy) {
                            gd.lineTo(gd.tx1, gd.ty2);
                            gd.lineTo(gd.l, gd.t);
                            gd.lineTo(gd.tx1, gd.ty4);
                            gd.lineTo(gd.tx1, gd.t);
                        } else {
                            gd.lineTo(gd.tx2, gd.ty1);
                            gd.lineTo(gd.l, gd.t);
                            gd.lineTo(gd.tx4, gd.ty1);
                            gd.lineTo(gd.l, gd.ty1);
                        }
                        break;
                }
            }
            if(!!shape.line && !!shape.line.w && !!shape.line.tailEnd) {
                switch(shape.line.tailEnd) {
                    case 'triangle':
                        if(shape.cx > shape.cy) {
                            gd.lineTo(gd.tx6, gd.b);
                            gd.lineTo(gd.tx6, gd.ty7);
                            gd.lineTo(gd.r, gd.b);
                            gd.lineTo(gd.tx6, gd.ty9);
                            gd.lineTo(gd.tx6, gd.b);
                        } else {
                            gd.lineTo(gd.r, gd.ty6);
                            gd.lineTo(gd.tx7, gd.ty6);
                            gd.lineTo(gd.r, gd.b);
                            gd.lineTo(gd.tx9, gd.ty6);
                            gd.lineTo(gd.r, gd.ty6);
                        }
                        break;
                }
            } else {
                gd.lineTo(gd.r, gd.b);
            }
            if(!!shape.line && !!shape.line.w && !!shape.line.headEnd) {
                switch(shape.line.headEnd) {
                    case 'triangle':
                        if(shape.cx > shape.cy) {
                            gd.lineTo(gd.tx1, gd.t);
                        } else {
                            gd.lineTo(gd.l, gd.ty1);
                        }
                        break;
                }
            } else {
                gd.lineTo(gd.l, gd.t);
            }
            gd.close();
        },
        'notchedRightArrow': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);
            shape.presetGeom.avList.forEach(function(a) {
                gd.addFormula(a.name, a.fmla);
            });

            gd.addFormula('maxAdj2', '*/ 100000 w ss');
            gd.addFormula('a1', 'pin 0 adj1 100000');
            gd.addFormula('a2', 'pin 0 adj2 maxAdj2');
            gd.addFormula('dx2', '*/ ss a2 100000');
            gd.addFormula('x2', '+- r 0 dx2');
            gd.addFormula('dy1', '*/ h a1 200000');
            gd.addFormula('y1', '+- vc 0 dy1');
            gd.addFormula('y2', '+- vc dy1 0');
            gd.addFormula('x1', '*/ dy1 dx2 hd2');
            gd.addFormula('x3', '+- r 0 x1');

            gd.moveTo(gd.l, gd.y1);
            gd.begin();
            gd.lineTo(gd.x2, gd.y1);
            gd.lineTo(gd.x2, gd.t);
            gd.lineTo(gd.r, gd.vc);
            gd.lineTo(gd.x2, gd.b);
            gd.lineTo(gd.x2, gd.y2);
            gd.lineTo(gd.l, gd.y2);
            gd.lineTo(gd.x1, gd.vc);
            gd.lineTo(gd.l, gd.y1);
            gd.close();
        },
        'leftBrace': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);
            shape.presetGeom.avList.forEach(function(a) {
                gd.addFormula(a.name, a.fmla);
            })

            gd.addFormula('a2', 'pin 0 adj2 100000');
            gd.addFormula('q1', '+- 100000 0 a2');
            gd.addFormula('q2', 'min q1 a2');
            gd.addFormula('q3', '*/ q2 1 2');
            gd.addFormula('maxAdj1', '*/ q3 h ss');
            gd.addFormula('a1', 'pin 0 adj1 maxAdj1');
            gd.addFormula('y1', '*/ ss a1 100000');
            gd.addFormula('y3', '*/ h a2 100000');
            gd.addFormula('y4', '+- y3 y1 0');
            gd.addFormula('dx1', 'cos wd2 2700000');
            gd.addFormula('dy1', 'sin y1 2700000');
            gd.addFormula('il', '+- r 0 dx1');
            gd.addFormula('it', '+- y1 0 dy1');
            gd.addFormula('ib', '+- b dy1 y1');

            gd.moveTo(gd.r, gd.b);
            gd.begin();
            gd.arcTo(gd.wd2, gd.y1, gd.cd4, gd.cd4);
            gd.lineTo(gd.hc, gd.y4);
            gd.arcTo(gd.wd2, gd.y1, 0, -5400000);
            gd.arcTo(gd.wd2, gd.y1, gd.cd4, -5400000);
            gd.lineTo(gd.hc, gd.y1);
            gd.arcTo(gd.wd2, gd.y1, gd.cd2, gd.cd4);

        },
        'triangle': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);
            shape.presetGeom.avList.forEach(function(a) {
                gd.addFormula(a.name, a.fmla);
            })

            gd.addFormula('a', 'pin 0 adj 100000');
            gd.addFormula('x1', '*/ w a 200000');
            gd.addFormula('x2', '*/ w a 100000');
            gd.addFormula('x3', '+- x1 wd2 0');

            gd.moveTo(gd.l, gd.b);
            gd.begin();
            gd.lineTo(gd.x2, gd.t);
            gd.lineTo(gd.r, gd.b);
            gd.lineTo(gd.l, gd.b);
            gd.close();
        },
        'ellipse': function(ctx, shape, emu2pixel) {
            var gd = new Guides(ctx, shape.cx, shape.cy, emu2pixel);

            gd.addFormula('idx', 'cos wd2 2700000');
            gd.addFormula('idy', 'sin hd2 2700000');
            gd.addFormula('il', '+- hc 0 idx');
            gd.addFormula('ir', '+- hc idx 0');
            gd.addFormula('it', '+- vc 0 idy');
            gd.addFormula('ib', '+- vc idy 0');

            gd.moveTo(gd.l, gd.vc);
            gd.begin();
            gd.arcTo(gd.wd2, gd.hd2, gd.cd2, gd.cd4);
            gd.arcTo(gd.wd2, gd.hd2, gd['3cd4'], gd.cd4);
            gd.arcTo(gd.wd2, gd.hd2, 0, gd.cd4);
            gd.arcTo(gd.wd2, gd.hd2, gd.cd4, gd.cd4);
            gd.close();
        }
    };
    function Guides(ctx, w, h, _c) {
        if(!!_c && typeof _c === 'function') {
            this.conv = _c;
        } else {
            if(!!emu2pixel && typeof emu2pixel === 'function') this.conv = emu2pixel;
            this.conv = function(n){return n};
        }
        var cur = {x:0,y:0};
        this.w = w;
        this.h = h;
        this.l = 0;
        this.t = 0;
        this['3cd4'] = 16200000;
        this['3cd8'] = 8100000;
        this['5cd8'] = 13500000;
        this['7cd8'] = 18900000;
        this.b = h;
        this.r = w;
        this.cd2 = 10800000;
        this.cd4 = 5400000;
        this.cd8 = 2700000;
        this.factor = 2 * Math.PI / 21600000;
        parse.call(this, 'hc', '*/ w 1 2');
        parse.call(this, 'hd2', '*/ h 1 2');
        parse.call(this, 'hd3', '*/ h 1 3');
        parse.call(this, 'hd4', '*/ h 1 4');
        parse.call(this, 'hd5', '*/ h 1 5');
        parse.call(this, 'hd6', '*/ h 1 6');
        parse.call(this, 'hd8', '*/ h 1 8');
        parse.call(this, 'ls', 'max w h');
        parse.call(this, 'ss', 'min w h');
        parse.call(this, 'ssd2', '*/ ss 1 2');
        parse.call(this, 'ssd4', '*/ ss 1 4');
        parse.call(this, 'ssd6', '*/ ss 1 6');
        parse.call(this, 'ssd8', '*/ ss 1 8');
        parse.call(this, 'ssd16', '*/ ss 1 16');
        parse.call(this, 'ssd32', '*/ ss 1 32');
        parse.call(this, 'vc', '*/ h 1 2');
        parse.call(this, 'wd2', '*/ w 1 2');
        parse.call(this, 'wd3', '*/ w 1 3');
        parse.call(this, 'wd4', '*/ w 1 4');
        parse.call(this, 'wd5', '*/ w 1 5');
        parse.call(this, 'wd6', '*/ w 1 6');
        parse.call(this, 'wd8', '*/ w 1 8');
        parse.call(this, 'wd10', '*/ 1 10');

        this.addFormula = function(name, fmla) {
            parse.call(this, name, fmla);
        };

        this.lineTo = function(x, y) {
            ctx.lineTo(this.conv(x), this.conv(y));
            cur.x = x, cur.y = y;
        };

        this.lnTo = this.lineTo;

        this.moveTo = function(x, y) {
            ctx.moveTo(this.conv(x), this.conv(y));
            cur.x = x, cur.y = y;
        };

        this.begin = function() {
            ctx.beginPath();
        };

        this.close = function() {
            ctx.closePath();
        };

        this.arcTo = function(hr, vr, sta, swa) {
            if(swa < 0) {
                var anticlock = true;
                if(sta + swa < 0) {
                    var end = sta + swa + 21600000;
                } else {
                    var end = sta + swa;
                }
            } else {
                var anticlock = false;
                var end = sta + swa;
            }
            var ecx = cur.x - hr * Math.cos(sta * 2 * Math.PI / 21600000);
            var ecy = cur.y - vr * Math.sin(sta * 2 * Math.PI / 21600000);
            ctx.ellipse(this.conv(ecx), this.conv(ecy), this.conv(hr), this.conv(vr), 0, sta * 2 * Math.PI / 21600000, end * 2 * Math.PI / 21600000, anticlock);
            cur.x = ecx + hr * Math.cos(end * 2 * Math.PI / 21600000);
            cur.y = ecy + vr * Math.sin(end * 2 * Math.PI / 21600000);
        };

        this.cubicBezTo = function(x1, y1, x2, y2, x, y) {
            ctx.bezierCurveTo(this.conv(x1), this.conv(y1), this.conv(x2), this.conv(y2), this.conv(x), this.conv(y));
            cur.x = x, cur.y = y;
        };

        function parse(name, fmla) {
            var key = fmla.split(/[ ]+/)[0];
            var args = fmla.split(/[ ]+/).slice(1);
            var circle = 21600;
            var factor = 2 * Math.PI / circle;
            var formulas = {
                "+-": function(a, b, c) {
                    return a + b - c;
                },
                "+/": function(a, b, c) {
                    return (a + b) / c;
                },
                "*/": function(a, b, c) {
                    return a * b / c;
                },
                "?:": function(a, b, c) {
                    return a>0?b:c;
                },
                "abs": function(a) {
                    return Math.abs(a);
                },
                "at2": function(a, b) {
                    return Math.atan(b/a*factor);
                },
                "cat2": function(a, b, c) {
                    return a * Math.cos(Math.atan(c/b*factor)*factor);
                },
                "cos": function(a, b) {
                    return a * Math.cos(b*factor);
                },
                "max": function(a, b) {
                    return a>b?a:b;
                },
                "min": function(a, b) {
                    return a>b?b:a;
                },
                "mod": function(a, b, c) {
                    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));
                },
                "pin": function(a, b, c) {
                    return b<a?a:b>c?c:b;
                },
                "sat2": function(a, b, c) {
                    return a * Math.sin(Math.atan(c/b*factor)*factor);
                },
                "sin": function(a, b) {
                    return a * Math.sin(b*factor);
                },
                "sqrt": function(a) {
                    return Math.sqrt(a);
                },
                "tan": function(a, b) {
                    return a * Math.tan(b*factor);
                },
                "val": function(a) {
                    if(isNaN(parseInt(a, 10))) return a;
                    return parseInt(a, 10);
                }
            };
            var that = this;
            var _args = args.reduce(function(pre, cur) {
                if(isNaN(parseInt(cur, 10))) {
                    pre.push(that[cur]);
                } else {
                    pre.push(parseInt(cur, 10));
                }
                return pre;
            }, []);
            if(!!formulas[key]) {
                this[name] = formulas[key].apply(this, _args);
            } else {
                throw "[Guide parse()] Operator or function not supported.";
            }
        }
    }
})(window);

/**
 * Created by fillano on 2017/2/7.
 */
