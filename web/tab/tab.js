/**
 * @author stone
 * @github https://github.com/stone0090/code-hodgepodge/tree/master/web/tab
 * @version 1.0.0
 * ===================================================
 * opts.wrap 	tab外围容器/滑动事件对象(id选择器)
 * opts.menu 	tab菜单容器/点击事件对象(id选择器)
 * opts.content	tab内容容器/滑动切换对象(id选择器) 
 * opts.index 	tab索引(默认0)，指定显示哪个索引的菜单、内容
 * opts.currentClassName    tab当前项的类名(默认为current)
 * opts.useDefualtCSS   是否使用默认样式(默认为true，需引入tab.css)
 * opts.duration    滑动的速度(默认为300，单位毫秒)
 * opts.callback    点击滑动时的回调函数(和菜单数量一致)
 * ===================================================
 **/
;
(function(window, document, Math, undefined) {
    'use strict';

    var Tab = function(opts) {
        if (typeof opts === undefined) {
            return;
        }

        this.wrap = document.getElementById(opts.wrap);
        this.menu = document.getElementById(opts.menu);
        this.content = document.getElementById(opts.content);

        this.menus = this.menu.children;
        this.contents = this.content.children;

        this.length = this.menus.length;
        if (this.length < 1) {
            return;
        }

        this.touch = {};

        this.opts = {
            currentClassName: 'current',
            useDefualtCSS: true,
            duration: 300,
            callback: []
        };

        for (var i in opts) {
            this.opts[i] = opts[i];
        }

        if (this.opts.index > this.length - 1) {
            this.opts.index = this.length - 1;
        }
        this.index = this.oldIndex = this.opts.index || 0;

        this._init();
    }

    Tab.prototype = {
        _init: function() {
            this._initSize();
            this._initClass();
            this._initEvent();
        },
        _initSize: function() {
            if (this.opts.useDefualtCSS) {
                this.height = document.documentElement.clientHeight || document.body.clientHeight;
                this.content.style.height = (this.height - 45) + 'px';
            }
            this.width = document.documentElement.clientWidth || document.body.clientWidth;
            this.content.style.width = this.length * this.width + 'px';
            for (var i = 0; i < this.length; i++) {
                this.contents[i].style.width = this.width + 'px';
            }
            this.content.style[utils.prefixStyle('transform')] = 'translate3d(' + (-this.index * this.width) + 'px,0,0)';
        },
        _resetSize: function() {
            this._initSize();
        },
        _initClass: function() {
            if (this.opts.useDefualtCSS) {
                this.content.className += ' tab-content';
                this.menu.className += ' tab-menu';
            }
            for (var i = 0; i < this.length; i++) {
                this.menus[i].index = i;
                this.menus[i].className = this.menus[i].className.replace(this.opts.currentClassName, '');
                this.contents[i].className = this.contents[i].className.replace(this.opts.currentClassName, '');
            }
            this.menus[this.index].className += ' ' + this.opts.currentClassName;
            this.contents[this.index].className += ' ' + this.opts.currentClassName;
        },
        _initEvent: function() {
            var me = this;
            utils.addHandler(this.wrap, 'touchstart', function(e) {
                me._touchStart(e);
            });
            utils.addHandler(this.wrap, 'touchmove', function(e) {
                me._touchMove(e);
            });
            utils.addHandler(this.wrap, 'touchend', function(e) {
                me._touchEnd(e);
            });
            utils.addHandler(this.wrap, 'touchcancel', function(e) {
                me._touchEnd(e);
            });
            utils.addHandler(this.menu, 'click', function(e) {
                me._touchClick(e);
            });
            utils.addHandler(this.content, utils.prefixHandler('transitionEnd'), function(e) {
                me._transitionEnd(e);
            });
            utils.addHandler(window, 'resize', function() {
                window.setTimeout(function() {
                    me._resetSize();
                }, 100);
            });
            utils.addHandler(window, 'orientationchange', function() {
                window.setTimeout(function() {
                    me._resetSize();
                }, 100);
            });
        },
        _touchStart: function(e) {
            this.touch.x = e.touches[0].pageX;
            this.touch.y = e.touches[0].pageY;
            this.touch.time = Date.now();
            this.touch.disX = 0;
            this.touch.disY = 0;
            this.touch.fixed = '';
        },
        _touchMove: function(e) {
            if (this.touch.fixed === 'up') {
                return;
            }

            // ie6 ~ ie8 not support e.stopPropagation
            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = false;
            }
            if (e.touches.length > 1 || e.scale && e.scale !== 1) {
                return;
            }

            this.touch.disX = e.touches[0].pageX - this.touch.x;
            this.touch.disY = e.touches[0].pageY - this.touch.y;
            if (this.touch.fixed === '') {
                if (Math.abs(this.touch.disY) > Math.abs(this.touch.disX)) {
                    this.touch.fixed = 'up';
                } else {
                    this.touch.fixed = 'left';
                }
            }
            if (this.touch.fixed === 'left') {
                // ie6 ~ ie8 not support e.preventDefault
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
                if ((this.index === 0 && this.touch.disX > 0) || (this.index === this.length - 1 && this.touch.disX < 0)) {
                    this.touch.disX /= 4;
                }
                this.content.style[utils.prefixStyle('transform')] = 'translate3d(' + (this.touch.disX - this.index * this.width) + 'px,0,0)';
            }
        },
        _touchEnd: function(e) {
            if (this.touch.fixed === 'left') {
                var absX = Math.abs(this.touch.disX);
                this.content.style[utils.prefixStyle('transition')] = 'all ' + this.opts.duration + 'ms';
                if ((Date.now() - this.touch.time > 100 && absX > 10) || absX > this.width / 2) {
                    this.touch.time = Date.now();
                    if (this.touch.disX > 0) {
                        this.index--;
                    } else {
                        this.index++;
                    }
                    if (this.index < 0) {
                        this.index = 0;
                    }
                    if (this.index > this.length - 1) {
                        this.index = this.length - 1;
                    }
                    if (this.index === this.oldIndex) {
                        this.content.style[utils.prefixStyle('transition')] = 'all ' + this.opts.duration + 'ms';
                    }
                    if (this.index !== this.oldIndex) {
                        this._replace();
                    }
                }
                this.content.style[utils.prefixStyle('transform')] = 'translate3d(' + (-this.index * this.width) + 'px,0,0)';
                if (this.opts.callback[this.index]) {
                    this.opts.callback[this.index]();
                }
            }
        },
        _transitionEnd: function() {
            this.content.style[utils.prefixStyle('transition')] = 'all 0ms';
        },
        _touchClick: function(e) {
            var target = e.target || e.srcElement;
            if (target.nodeType === 1 && typeof target.index !== undefined) {
                if (target.index === this.index) {
                    return;
                }

                // ie6 ~ ie8 not support e.preventDefault
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }

                // ie6 ~ ie8 not support e.stopPropagation
                if (e.stopPropagation) {
                    e.stopPropagation();
                } else {
                    e.cancelBubble = false;
                }

                this.index = target.index;
                this.content.style[utils.prefixStyle('transition')] = 'all ' + this.opts.duration + 'ms';
                this.content.style[utils.prefixStyle('transform')] = 'translate3d(' + (-this.index * this.width) + 'px,0,0)';
                if (this.opts.callback[this.index]) {
                    this.opts.callback[this.index]();
                }
                this._replace();
            }
        },
        _replace: function() {
            this.menus[this.index].className += ' ' + this.opts.currentClassName;
            this.menus[this.oldIndex].className = this.menus[this.oldIndex].className.replace(this.opts.currentClassName, '').trim();
            this.contents[this.index].className += ' ' + this.opts.currentClassName;
            this.contents[this.oldIndex].className = this.contents[this.oldIndex].className.replace(this.opts.currentClassName, '').trim();
            this.oldIndex = this.index;
        }
    };

    // 公共方法
    var utils = (function(window, document) {
        var _me = {};
        var _elementDiv = document.createElement('div').style;
        var _vendor = (function() {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                l = vendors.length;
            for (var i = 0; i < l; i++) {
                transform = vendors[i] + 'ransform';
                if (transform in _elementDiv) {
                    return vendors[i].substr(0, vendors[i].length - 1);
                }
            }
            return false;
        })();
        _me.prefixStyle = function(style) {
            if (_vendor === false) return false;
            if (_vendor === '') return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        };
        _me.prefixHandler = function(handler) {
            if (_vendor === false) return false;
            if (_vendor === '') return handler;
            return _vendor.replace('ms', '') + handler.charAt(0).toUpperCase() + handler.substr(1);
        };
        _me.addHandler = function(el, type, handler, args) {
            if (el.addEventListener) {
                el.addEventListener(type, handler, false);
            } else if (el.attachEvent) {
                el.attachEvent('on' + type, handler);
            } else {
                el['on' + type] = handler;
            }
        };
        _me.removeHandler = function(el, type, handler, args) {
            if (el.removeEventListener) {
                el.removeEventListener(type, handler, false);
            } else if (el.detachEvent) {
                el.detachEvent('on' + type, handler);
            } else {
                el['on' + type] = null;
            }
        };
        _me.ready = function(callback) {
            if (/complete|loaded|interactive/.test(document.readyState) && document.body) {
                callback();
            } else {
                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', callback, false);
                } else if (document.attachEvent) {
                    document.attachEvent('onreadystatechange', callback);
                } else {
                    document.onreadystatechange = callback;
                }
            }
        };
        return _me;
    })(window, document);

    // ie6 ~ ie8 not support trim()
    String.prototype.trim = function() {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    window.Tab = Tab;

})(window, document, Math);