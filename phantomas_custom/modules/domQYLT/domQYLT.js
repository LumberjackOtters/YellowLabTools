/**
 * Analyzes DOM queries done via native DOM methods
 */
/* global Element: true, Document: true, Node: true, window: true */

exports.version = '0.7.a';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('DOMqueries'); // @desc number of all DOM queries @offenders
    phantomas.setMetric('DOMqueriesById'); // @desc number of document.getElementById calls
    phantomas.setMetric('DOMqueriesByClassName'); // @desc number of document.getElementsByClassName calls
    phantomas.setMetric('DOMqueriesByTagName'); // @desc number of document.getElementsByTagName calls
    phantomas.setMetric('DOMqueriesByQuerySelectorAll'); // @desc number of document.querySelector(All) calls
    phantomas.setMetric('DOMinserts'); // @desc number of DOM nodes inserts
    phantomas.setMetric('DOMqueriesDuplicated'); // @desc number of duplicated DOM queries

    // fake native DOM functions
    phantomas.once('init', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                function querySpy(type, query, fnName) {
                    phantomas.emit('domQuery', type, query, fnName); // @desc DOM query has been made
                }

                phantomas.spy(Document.prototype, 'getElementById', function(id) {
                    phantomas.incrMetric('DOMqueriesById');
                    querySpy('id', '#' + id, 'getElementById');

                    phantomas.enterContext({
                        type: 'getElementById',
                        callDetails: {
                            context: {
                                domElement: '#document'
                            },
                            arguments: ['#' + id]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });

                }, phantomas.leaveContext);

                // selectors by class name
                function selectorClassNameSpyBefore(className) {
                    /*jshint validthis: true */

                    phantomas.incrMetric('DOMqueriesByClassName');
                    phantomas.addOffender('DOMqueriesByClassName', '.' + className);
                    querySpy('class', '.' + className, 'getElementsByClassName');

                    phantomas.enterContext({
                        type: 'getElementsByClassName',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: ['.' + className]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                phantomas.spy(Document.prototype, 'getElementsByClassName', selectorClassNameSpyBefore, phantomas.leaveContext);
                phantomas.spy(Element.prototype, 'getElementsByClassName', selectorClassNameSpyBefore, phantomas.leaveContext);

                // selectors by tag name
                function selectorTagNameSpyBefore(tagName) {
                    /*jshint validthis: true */

                    phantomas.incrMetric('DOMqueriesByTagName');
                    phantomas.addOffender('DOMqueriesByTagName', tagName);
                    querySpy('tag name', tagName, 'getElementsByTagName');

                    phantomas.enterContext({
                        type: 'getElementsByTagName',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: [tagName]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                phantomas.spy(Document.prototype, 'getElementsByTagName', selectorTagNameSpyBefore, phantomas.leaveContext);
                phantomas.spy(Element.prototype, 'getElementsByTagName', selectorTagNameSpyBefore, phantomas.leaveContext);

                // selector queries
                function selectorQuerySpy(selector) {
                    phantomas.incrMetric('DOMqueriesByQuerySelectorAll');
                    phantomas.addOffender('DOMqueriesByQuerySelectorAll', selector);
                    querySpy('selector', selector, 'querySelectorAll');
                }

                function selectorQuerySpyBefore(selector) {
                    /*jshint validthis: true */

                    selectorQuerySpy(selector);

                    phantomas.enterContext({
                        type: 'querySelector',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: [selector]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function selectorAllQuerySpyBefore(selector) {
                    /*jshint validthis: true */

                    selectorQuerySpy(selector);

                    phantomas.enterContext({
                        type: 'querySelectorAll',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: [selector]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                phantomas.spy(Document.prototype, 'querySelector', selectorQuerySpyBefore, phantomas.leaveContext);
                phantomas.spy(Document.prototype, 'querySelectorAll', selectorAllQuerySpyBefore, phantomas.leaveContext);
                phantomas.spy(Element.prototype, 'querySelector', selectorQuerySpyBefore, phantomas.leaveContext);
                phantomas.spy(Element.prototype, 'querySelectorAll', selectorAllQuerySpyBefore, phantomas.leaveContext);


                // count DOM inserts
                function appendChild(child) {
                    /*jshint validthis: true */

                    // ignore appending to the node that's not yet added to DOM tree
                    if (!this.parentNode) {
                        return;
                    }

                    var destNodePath = phantomas.getDOMPath(this),
                        appendedNodePath = phantomas.getDOMPath(child);

                    // don't count elements added to fragments as a DOM inserts (issue #350)
                    // DocumentFragment > div[0]
                    if (destNodePath.indexOf('DocumentFragment') === 0) {
                        return;
                    }

                    phantomas.incrMetric('DOMinserts');
                    phantomas.addOffender('DOMinserts', '"%s" appended to "%s"', appendedNodePath, destNodePath);

                    phantomas.log('DOM insert: node "%s" appended to "%s"', appendedNodePath, destNodePath);
                }

                function appendChildSpyBefore(child) {
                    /*jshint validthis: true */

                    appendChild(child);

                    phantomas.enterContext({
                        type: 'appendChild',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: [phantomas.getDOMPath(child)]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function insertBeforeSpyBefore(child) {
                    /*jshint validthis: true */
                    
                    appendChild(child);

                    phantomas.enterContext({
                        type: 'insertBefore',
                        callDetails: {
                            context: {
                                domElement: phantomas.getDOMPath(this)
                            },
                            arguments: [phantomas.getDOMPath(child)]
                        },
                        caller: phantomas.getCaller(1),
                        backtrace: phantomas.getBacktrace()
                    });
                }

                phantomas.spy(Node.prototype, 'appendChild', appendChildSpyBefore, phantomas.leaveContext);
                phantomas.spy(Node.prototype, 'insertBefore', insertBeforeSpyBefore, phantomas.leaveContext);
            })(window.__phantomas);
        });
    });

    // count DOM queries by either ID, tag name, class name and selector query
    // @see https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#dom-document-doctype
    var Collection = require('../../../node_modules/phantomas/lib/collection'),
        DOMqueries = new Collection();

    phantomas.on('domQuery', function(type, query, fnName) {
        phantomas.log('DOM query: by %s - "%s" (using %s)', type, query, fnName);
        phantomas.incrMetric('DOMqueries');

        DOMqueries.push(type + ' "' + query + '"');
    });

    phantomas.on('report', function() {
        DOMqueries.sort().forEach(function(query, cnt) {
            if (cnt > 1) {
                phantomas.incrMetric('DOMqueriesDuplicated');
                phantomas.addOffender('DOMqueriesDuplicated', '%s: %d queries', query, cnt);
            }
        });
    });
};