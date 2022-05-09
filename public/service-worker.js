(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('dexie'), require('rxjs')) :
    typeof define === 'function' && define.amd ? define(['dexie', 'rxjs'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Dexie, global.rxjs));
})(undefined, (function (Dexie, rxjs) {
    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var Dexie__default = /*#__PURE__*/_interopDefaultLegacy(Dexie);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter$1(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const UNAUTHORIZED_USER = {
        userId: "unauthorized",
        name: "Unauthorized",
        claims: {
            sub: "unauthorized",
        },
        lastLogin: new Date(0)
    };
    try {
        Object.freeze(UNAUTHORIZED_USER);
        Object.freeze(UNAUTHORIZED_USER.claims);
    }
    catch (_a) { }

    const swHolder = {};
    const swContainer = self.document && navigator.serviceWorker; // self.document is to verify we're not the SW ourself
    if (swContainer)
        swContainer.ready.then((registration) => (swHolder.registration = registration));
    if (typeof self !== 'undefined' && 'clients' in self && !self.document) {
        // We are the service worker. Propagate messages to all our clients.
        addEventListener('message', (ev) => {
            var _a, _b;
            if ((_b = (_a = ev.data) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.startsWith('sw-broadcast-')) {
                [...self['clients'].matchAll({ includeUncontrolled: true })].forEach((client) => { var _a; return client.id !== ((_a = ev.source) === null || _a === void 0 ? void 0 : _a.id) && client.postMessage(ev.data); });
            }
        });
    }
    class SWBroadcastChannel {
        constructor(name) {
            this.name = name;
        }
        subscribe(listener) {
            if (!swContainer)
                return () => { };
            const forwarder = (ev) => {
                var _a;
                if (((_a = ev.data) === null || _a === void 0 ? void 0 : _a.type) === `sw-broadcast-${this.name}`) {
                    listener(ev.data.message);
                }
            };
            swContainer.addEventListener('message', forwarder);
            return () => swContainer.removeEventListener('message', forwarder);
        }
        postMessage(message) {
            var _a;
            if (typeof self['clients'] === 'object') {
                // We're a service worker. Propagate to our browser clients.
                [...self['clients'].matchAll({ includeUncontrolled: true })].forEach((client) => client.postMessage({
                    type: `sw-broadcast-${this.name}`,
                    message
                }));
            }
            else if (swHolder.registration) {
                // We're a client (browser window or other worker)
                // Post to SW so it can repost to all its clients and to itself
                (_a = swHolder.registration.active) === null || _a === void 0 ? void 0 : _a.postMessage({
                    type: `sw-broadcast-${this.name}`,
                    message
                });
            }
        }
    }

    class BroadcastedAndLocalEvent extends rxjs.Observable {
        constructor(name) {
            const bc = typeof BroadcastChannel === "undefined"
                ? new SWBroadcastChannel(name) : new BroadcastChannel(name);
            super(subscriber => {
                function onCustomEvent(ev) {
                    subscriber.next(ev.detail);
                }
                function onMessageEvent(ev) {
                    console.debug("BroadcastedAndLocalEvent: onMessageEvent", ev);
                    subscriber.next(ev.data);
                }
                let unsubscribe;
                self.addEventListener(`lbc-${name}`, onCustomEvent);
                if (bc instanceof SWBroadcastChannel) {
                    unsubscribe = bc.subscribe(message => subscriber.next(message));
                }
                else {
                    console.debug("BroadcastedAndLocalEvent: bc.addEventListener()", name, "bc is a", bc);
                    bc.addEventListener("message", onMessageEvent);
                }
                return () => {
                    self.removeEventListener(`lbc-${name}`, onCustomEvent);
                    if (bc instanceof SWBroadcastChannel) {
                        unsubscribe();
                    }
                    else {
                        bc.removeEventListener("message", onMessageEvent);
                    }
                };
            });
            this.name = name;
            this.bc = bc;
        }
        next(message) {
            console.debug("BroadcastedAndLocalEvent: bc.postMessage()", Object.assign({}, message), "bc is a", this.bc);
            this.bc.postMessage(message);
            const ev = new CustomEvent(`lbc-${this.name}`, { detail: message });
            self.dispatchEvent(ev);
        }
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function hasLift(source) {
        return isFunction(source === null || source === void 0 ? void 0 : source.lift);
    }
    function operate(init) {
        return function (source) {
            if (hasLift(source)) {
                return source.lift(function (liftedSource) {
                    try {
                        return init(liftedSource, this);
                    }
                    catch (err) {
                        this.error(err);
                    }
                });
            }
            throw new TypeError('Unable to lift unknown Observable type');
        };
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });

    function isPromise(value) {
        return isFunction(value === null || value === void 0 ? void 0 : value.then);
    }

    function createErrorClass(createImpl) {
        var _super = function (instance) {
            Error.call(instance);
            instance.stack = new Error().stack;
        };
        var ctorFunc = createImpl(_super);
        ctorFunc.prototype = Object.create(Error.prototype);
        ctorFunc.prototype.constructor = ctorFunc;
        return ctorFunc;
    }

    var UnsubscriptionError = createErrorClass(function (_super) {
        return function UnsubscriptionErrorImpl(errors) {
            _super(this);
            this.message = errors
                ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
                : '';
            this.name = 'UnsubscriptionError';
            this.errors = errors;
        };
    });

    function arrRemove(arr, item) {
        if (arr) {
            var index = arr.indexOf(item);
            0 <= index && arr.splice(index, 1);
        }
    }

    var Subscription = (function () {
        function Subscription(initialTeardown) {
            this.initialTeardown = initialTeardown;
            this.closed = false;
            this._parentage = null;
            this._teardowns = null;
        }
        Subscription.prototype.unsubscribe = function () {
            var e_1, _a, e_2, _b;
            var errors;
            if (!this.closed) {
                this.closed = true;
                var _parentage = this._parentage;
                if (_parentage) {
                    this._parentage = null;
                    if (Array.isArray(_parentage)) {
                        try {
                            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                                var parent_1 = _parentage_1_1.value;
                                parent_1.remove(this);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    else {
                        _parentage.remove(this);
                    }
                }
                var initialTeardown = this.initialTeardown;
                if (isFunction(initialTeardown)) {
                    try {
                        initialTeardown();
                    }
                    catch (e) {
                        errors = e instanceof UnsubscriptionError ? e.errors : [e];
                    }
                }
                var _teardowns = this._teardowns;
                if (_teardowns) {
                    this._teardowns = null;
                    try {
                        for (var _teardowns_1 = __values(_teardowns), _teardowns_1_1 = _teardowns_1.next(); !_teardowns_1_1.done; _teardowns_1_1 = _teardowns_1.next()) {
                            var teardown_1 = _teardowns_1_1.value;
                            try {
                                execTeardown(teardown_1);
                            }
                            catch (err) {
                                errors = errors !== null && errors !== void 0 ? errors : [];
                                if (err instanceof UnsubscriptionError) {
                                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                                }
                                else {
                                    errors.push(err);
                                }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_teardowns_1_1 && !_teardowns_1_1.done && (_b = _teardowns_1.return)) _b.call(_teardowns_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                if (errors) {
                    throw new UnsubscriptionError(errors);
                }
            }
        };
        Subscription.prototype.add = function (teardown) {
            var _a;
            if (teardown && teardown !== this) {
                if (this.closed) {
                    execTeardown(teardown);
                }
                else {
                    if (teardown instanceof Subscription) {
                        if (teardown.closed || teardown._hasParent(this)) {
                            return;
                        }
                        teardown._addParent(this);
                    }
                    (this._teardowns = (_a = this._teardowns) !== null && _a !== void 0 ? _a : []).push(teardown);
                }
            }
        };
        Subscription.prototype._hasParent = function (parent) {
            var _parentage = this._parentage;
            return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
        };
        Subscription.prototype._addParent = function (parent) {
            var _parentage = this._parentage;
            this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
        };
        Subscription.prototype._removeParent = function (parent) {
            var _parentage = this._parentage;
            if (_parentage === parent) {
                this._parentage = null;
            }
            else if (Array.isArray(_parentage)) {
                arrRemove(_parentage, parent);
            }
        };
        Subscription.prototype.remove = function (teardown) {
            var _teardowns = this._teardowns;
            _teardowns && arrRemove(_teardowns, teardown);
            if (teardown instanceof Subscription) {
                teardown._removeParent(this);
            }
        };
        Subscription.EMPTY = (function () {
            var empty = new Subscription();
            empty.closed = true;
            return empty;
        })();
        return Subscription;
    }());
    function isSubscription(value) {
        return (value instanceof Subscription ||
            (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
    }
    function execTeardown(teardown) {
        if (isFunction(teardown)) {
            teardown();
        }
        else {
            teardown.unsubscribe();
        }
    }

    var config = {
        onUnhandledError: null,
        onStoppedNotification: null,
        Promise: undefined,
        useDeprecatedSynchronousErrorHandling: false,
        useDeprecatedNextContext: false,
    };

    var timeoutProvider = {
        setTimeout: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var delegate = timeoutProvider.delegate;
            return ((delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) || setTimeout).apply(void 0, __spreadArray([], __read(args)));
        },
        clearTimeout: function (handle) {
            return (clearTimeout)(handle);
        },
        delegate: undefined,
    };

    function reportUnhandledError(err) {
        timeoutProvider.setTimeout(function () {
            {
                throw err;
            }
        });
    }

    function noop() { }
    function errorContext(cb) {
        {
            cb();
        }
    }

    var Subscriber = (function (_super) {
        __extends(Subscriber, _super);
        function Subscriber(destination) {
            var _this = _super.call(this) || this;
            _this.isStopped = false;
            if (destination) {
                _this.destination = destination;
                if (isSubscription(destination)) {
                    destination.add(_this);
                }
            }
            else {
                _this.destination = EMPTY_OBSERVER;
            }
            return _this;
        }
        Subscriber.create = function (next, error, complete) {
            return new SafeSubscriber(next, error, complete);
        };
        Subscriber.prototype.next = function (value) {
            if (this.isStopped) ;
            else {
                this._next(value);
            }
        };
        Subscriber.prototype.error = function (err) {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._error(err);
            }
        };
        Subscriber.prototype.complete = function () {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._complete();
            }
        };
        Subscriber.prototype.unsubscribe = function () {
            if (!this.closed) {
                this.isStopped = true;
                _super.prototype.unsubscribe.call(this);
                this.destination = null;
            }
        };
        Subscriber.prototype._next = function (value) {
            this.destination.next(value);
        };
        Subscriber.prototype._error = function (err) {
            try {
                this.destination.error(err);
            }
            finally {
                this.unsubscribe();
            }
        };
        Subscriber.prototype._complete = function () {
            try {
                this.destination.complete();
            }
            finally {
                this.unsubscribe();
            }
        };
        return Subscriber;
    }(Subscription));
    var SafeSubscriber = (function (_super) {
        __extends(SafeSubscriber, _super);
        function SafeSubscriber(observerOrNext, error, complete) {
            var _this = _super.call(this) || this;
            var next;
            if (isFunction(observerOrNext)) {
                next = observerOrNext;
            }
            else if (observerOrNext) {
                (next = observerOrNext.next, error = observerOrNext.error, complete = observerOrNext.complete);
                var context_1;
                if (_this && config.useDeprecatedNextContext) {
                    context_1 = Object.create(observerOrNext);
                    context_1.unsubscribe = function () { return _this.unsubscribe(); };
                }
                else {
                    context_1 = observerOrNext;
                }
                next = next === null || next === void 0 ? void 0 : next.bind(context_1);
                error = error === null || error === void 0 ? void 0 : error.bind(context_1);
                complete = complete === null || complete === void 0 ? void 0 : complete.bind(context_1);
            }
            _this.destination = {
                next: next ? wrapForErrorHandling(next) : noop,
                error: wrapForErrorHandling(error !== null && error !== void 0 ? error : defaultErrorHandler),
                complete: complete ? wrapForErrorHandling(complete) : noop,
            };
            return _this;
        }
        return SafeSubscriber;
    }(Subscriber));
    function wrapForErrorHandling(handler, instance) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                handler.apply(void 0, __spreadArray([], __read(args)));
            }
            catch (err) {
                {
                    reportUnhandledError(err);
                }
            }
        };
    }
    function defaultErrorHandler(err) {
        throw err;
    }
    var EMPTY_OBSERVER = {
        closed: true,
        next: noop,
        error: defaultErrorHandler,
        complete: noop,
    };

    var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

    function identity(x) {
        return x;
    }

    function pipeFromArray(fns) {
        if (fns.length === 0) {
            return identity;
        }
        if (fns.length === 1) {
            return fns[0];
        }
        return function piped(input) {
            return fns.reduce(function (prev, fn) { return fn(prev); }, input);
        };
    }

    var Observable = (function () {
        function Observable(subscribe) {
            if (subscribe) {
                this._subscribe = subscribe;
            }
        }
        Observable.prototype.lift = function (operator) {
            var observable = new Observable();
            observable.source = this;
            observable.operator = operator;
            return observable;
        };
        Observable.prototype.subscribe = function (observerOrNext, error, complete) {
            var _this = this;
            var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
            errorContext(function () {
                var _a = _this, operator = _a.operator, source = _a.source;
                subscriber.add(operator
                    ?
                        operator.call(subscriber, source)
                    : source
                        ?
                            _this._subscribe(subscriber)
                        :
                            _this._trySubscribe(subscriber));
            });
            return subscriber;
        };
        Observable.prototype._trySubscribe = function (sink) {
            try {
                return this._subscribe(sink);
            }
            catch (err) {
                sink.error(err);
            }
        };
        Observable.prototype.forEach = function (next, promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var subscription;
                subscription = _this.subscribe(function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
                    }
                }, reject, resolve);
            });
        };
        Observable.prototype._subscribe = function (subscriber) {
            var _a;
            return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
        };
        Observable.prototype[observable] = function () {
            return this;
        };
        Observable.prototype.pipe = function () {
            var operations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                operations[_i] = arguments[_i];
            }
            return pipeFromArray(operations)(this);
        };
        Observable.prototype.toPromise = function (promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var value;
                _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
            });
        };
        Observable.create = function (subscribe) {
            return new Observable(subscribe);
        };
        return Observable;
    }());
    function getPromiseCtor(promiseCtor) {
        var _a;
        return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
    }
    function isObserver(value) {
        return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
    }
    function isSubscriber(value) {
        return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
    }

    function isInteropObservable(input) {
        return isFunction(input[observable]);
    }

    function isAsyncIterable(obj) {
        return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
    }

    function createInvalidObservableTypeError(input) {
        return new TypeError("You provided " + (input !== null && typeof input === 'object' ? 'an invalid object' : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }

    function getSymbolIterator() {
        if (typeof Symbol !== 'function' || !Symbol.iterator) {
            return '@@iterator';
        }
        return Symbol.iterator;
    }
    var iterator = getSymbolIterator();

    function isIterable(input) {
        return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
    }

    function readableStreamLikeToAsyncGenerator(readableStream) {
        return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
            var reader, _a, value, done;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        reader = readableStream.getReader();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 9, 10]);
                        _b.label = 2;
                    case 2:
                        return [4, __await(reader.read())];
                    case 3:
                        _a = _b.sent(), value = _a.value, done = _a.done;
                        if (!done) return [3, 5];
                        return [4, __await(void 0)];
                    case 4: return [2, _b.sent()];
                    case 5: return [4, __await(value)];
                    case 6: return [4, _b.sent()];
                    case 7:
                        _b.sent();
                        return [3, 2];
                    case 8: return [3, 10];
                    case 9:
                        reader.releaseLock();
                        return [7];
                    case 10: return [2];
                }
            });
        });
    }
    function isReadableStreamLike(obj) {
        return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
    }

    function innerFrom(input) {
        if (input instanceof Observable) {
            return input;
        }
        if (input != null) {
            if (isInteropObservable(input)) {
                return fromInteropObservable(input);
            }
            if (isArrayLike(input)) {
                return fromArrayLike(input);
            }
            if (isPromise(input)) {
                return fromPromise(input);
            }
            if (isAsyncIterable(input)) {
                return fromAsyncIterable(input);
            }
            if (isIterable(input)) {
                return fromIterable(input);
            }
            if (isReadableStreamLike(input)) {
                return fromReadableStreamLike(input);
            }
        }
        throw createInvalidObservableTypeError(input);
    }
    function fromInteropObservable(obj) {
        return new Observable(function (subscriber) {
            var obs = obj[observable]();
            if (isFunction(obs.subscribe)) {
                return obs.subscribe(subscriber);
            }
            throw new TypeError('Provided object does not correctly implement Symbol.observable');
        });
    }
    function fromArrayLike(array) {
        return new Observable(function (subscriber) {
            for (var i = 0; i < array.length && !subscriber.closed; i++) {
                subscriber.next(array[i]);
            }
            subscriber.complete();
        });
    }
    function fromPromise(promise) {
        return new Observable(function (subscriber) {
            promise
                .then(function (value) {
                if (!subscriber.closed) {
                    subscriber.next(value);
                    subscriber.complete();
                }
            }, function (err) { return subscriber.error(err); })
                .then(null, reportUnhandledError);
        });
    }
    function fromIterable(iterable) {
        return new Observable(function (subscriber) {
            var e_1, _a;
            try {
                for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
                    var value = iterable_1_1.value;
                    subscriber.next(value);
                    if (subscriber.closed) {
                        return;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            subscriber.complete();
        });
    }
    function fromAsyncIterable(asyncIterable) {
        return new Observable(function (subscriber) {
            process(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
        });
    }
    function fromReadableStreamLike(readableStream) {
        return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
    }
    function process(asyncIterable, subscriber) {
        var asyncIterable_1, asyncIterable_1_1;
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function () {
            var value, e_2_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 11]);
                        asyncIterable_1 = __asyncValues(asyncIterable);
                        _b.label = 1;
                    case 1: return [4, asyncIterable_1.next()];
                    case 2:
                        if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
                        value = asyncIterable_1_1.value;
                        subscriber.next(value);
                        if (subscriber.closed) {
                            return [2];
                        }
                        _b.label = 3;
                    case 3: return [3, 1];
                    case 4: return [3, 11];
                    case 5:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 11];
                    case 6:
                        _b.trys.push([6, , 9, 10]);
                        if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
                        return [4, _a.call(asyncIterable_1)];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8: return [3, 10];
                    case 9:
                        if (e_2) throw e_2.error;
                        return [7];
                    case 10: return [7];
                    case 11:
                        subscriber.complete();
                        return [2];
                }
            });
        });
    }

    var OperatorSubscriber = (function (_super) {
        __extends(OperatorSubscriber, _super);
        function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
            var _this = _super.call(this, destination) || this;
            _this.onFinalize = onFinalize;
            _this._next = onNext
                ? function (value) {
                    try {
                        onNext(value);
                    }
                    catch (err) {
                        destination.error(err);
                    }
                }
                : _super.prototype._next;
            _this._error = onError
                ? function (err) {
                    try {
                        onError(err);
                    }
                    catch (err) {
                        destination.error(err);
                    }
                    finally {
                        this.unsubscribe();
                    }
                }
                : _super.prototype._error;
            _this._complete = onComplete
                ? function () {
                    try {
                        onComplete();
                    }
                    catch (err) {
                        destination.error(err);
                    }
                    finally {
                        this.unsubscribe();
                    }
                }
                : _super.prototype._complete;
            return _this;
        }
        OperatorSubscriber.prototype.unsubscribe = function () {
            var _a;
            var closed = this.closed;
            _super.prototype.unsubscribe.call(this);
            !closed && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        };
        return OperatorSubscriber;
    }(Subscriber));

    var Action = (function (_super) {
        __extends(Action, _super);
        function Action(scheduler, work) {
            return _super.call(this) || this;
        }
        Action.prototype.schedule = function (state, delay) {
            return this;
        };
        return Action;
    }(Subscription));

    var intervalProvider = {
        setInterval: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var delegate = intervalProvider.delegate;
            return ((delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) || setInterval).apply(void 0, __spreadArray([], __read(args)));
        },
        clearInterval: function (handle) {
            return (clearInterval)(handle);
        },
        delegate: undefined,
    };

    var AsyncAction = (function (_super) {
        __extends(AsyncAction, _super);
        function AsyncAction(scheduler, work) {
            var _this = _super.call(this, scheduler, work) || this;
            _this.scheduler = scheduler;
            _this.work = work;
            _this.pending = false;
            return _this;
        }
        AsyncAction.prototype.schedule = function (state, delay) {
            if (delay === void 0) { delay = 0; }
            if (this.closed) {
                return this;
            }
            this.state = state;
            var id = this.id;
            var scheduler = this.scheduler;
            if (id != null) {
                this.id = this.recycleAsyncId(scheduler, id, delay);
            }
            this.pending = true;
            this.delay = delay;
            this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
            return this;
        };
        AsyncAction.prototype.requestAsyncId = function (scheduler, _id, delay) {
            if (delay === void 0) { delay = 0; }
            return intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
        };
        AsyncAction.prototype.recycleAsyncId = function (_scheduler, id, delay) {
            if (delay === void 0) { delay = 0; }
            if (delay != null && this.delay === delay && this.pending === false) {
                return id;
            }
            intervalProvider.clearInterval(id);
            return undefined;
        };
        AsyncAction.prototype.execute = function (state, delay) {
            if (this.closed) {
                return new Error('executing a cancelled action');
            }
            this.pending = false;
            var error = this._execute(state, delay);
            if (error) {
                return error;
            }
            else if (this.pending === false && this.id != null) {
                this.id = this.recycleAsyncId(this.scheduler, this.id, null);
            }
        };
        AsyncAction.prototype._execute = function (state, _delay) {
            var errored = false;
            var errorValue;
            try {
                this.work(state);
            }
            catch (e) {
                errored = true;
                errorValue = e ? e : new Error('Scheduled action threw falsy error');
            }
            if (errored) {
                this.unsubscribe();
                return errorValue;
            }
        };
        AsyncAction.prototype.unsubscribe = function () {
            if (!this.closed) {
                var _a = this, id = _a.id, scheduler = _a.scheduler;
                var actions = scheduler.actions;
                this.work = this.state = this.scheduler = null;
                this.pending = false;
                arrRemove(actions, this);
                if (id != null) {
                    this.id = this.recycleAsyncId(scheduler, id, null);
                }
                this.delay = null;
                _super.prototype.unsubscribe.call(this);
            }
        };
        return AsyncAction;
    }(Action));

    var dateTimestampProvider = {
        now: function () {
            return (Date).now();
        },
        delegate: undefined,
    };

    var Scheduler = (function () {
        function Scheduler(schedulerActionCtor, now) {
            if (now === void 0) { now = Scheduler.now; }
            this.schedulerActionCtor = schedulerActionCtor;
            this.now = now;
        }
        Scheduler.prototype.schedule = function (work, delay, state) {
            if (delay === void 0) { delay = 0; }
            return new this.schedulerActionCtor(this, work).schedule(state, delay);
        };
        Scheduler.now = dateTimestampProvider.now;
        return Scheduler;
    }());

    var AsyncScheduler = (function (_super) {
        __extends(AsyncScheduler, _super);
        function AsyncScheduler(SchedulerAction, now) {
            if (now === void 0) { now = Scheduler.now; }
            var _this = _super.call(this, SchedulerAction, now) || this;
            _this.actions = [];
            _this._active = false;
            _this._scheduled = undefined;
            return _this;
        }
        AsyncScheduler.prototype.flush = function (action) {
            var actions = this.actions;
            if (this._active) {
                actions.push(action);
                return;
            }
            var error;
            this._active = true;
            do {
                if ((error = action.execute(action.state, action.delay))) {
                    break;
                }
            } while ((action = actions.shift()));
            this._active = false;
            if (error) {
                while ((action = actions.shift())) {
                    action.unsubscribe();
                }
                throw error;
            }
        };
        return AsyncScheduler;
    }(Scheduler));

    var asyncScheduler = new AsyncScheduler(AsyncAction);
    var async = asyncScheduler;

    function isScheduler(value) {
        return value && isFunction(value.schedule);
    }

    function isValidDate(value) {
        return value instanceof Date && !isNaN(value);
    }

    function timer(dueTime, intervalOrScheduler, scheduler) {
        if (dueTime === void 0) { dueTime = 0; }
        if (scheduler === void 0) { scheduler = async; }
        var intervalDuration = -1;
        if (intervalOrScheduler != null) {
            if (isScheduler(intervalOrScheduler)) {
                scheduler = intervalOrScheduler;
            }
            else {
                intervalDuration = intervalOrScheduler;
            }
        }
        return new Observable(function (subscriber) {
            var due = isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
            if (due < 0) {
                due = 0;
            }
            var n = 0;
            return scheduler.schedule(function () {
                if (!subscriber.closed) {
                    subscriber.next(n++);
                    if (0 <= intervalDuration) {
                        this.schedule(undefined, intervalDuration);
                    }
                    else {
                        subscriber.complete();
                    }
                }
            }, due);
        });
    }

    function last(arr) {
        return arr[arr.length - 1];
    }
    function popScheduler(args) {
        return isScheduler(last(args)) ? args.pop() : undefined;
    }

    function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
        if (delay === void 0) { delay = 0; }
        if (repeat === void 0) { repeat = false; }
        var scheduleSubscription = scheduler.schedule(function () {
            work();
            if (repeat) {
                parentSubscription.add(this.schedule(null, delay));
            }
            else {
                this.unsubscribe();
            }
        }, delay);
        parentSubscription.add(scheduleSubscription);
        if (!repeat) {
            return scheduleSubscription;
        }
    }

    function catchError(selector) {
        return operate(function (source, subscriber) {
            var innerSub = null;
            var syncUnsub = false;
            var handledResult;
            innerSub = source.subscribe(new OperatorSubscriber(subscriber, undefined, undefined, function (err) {
                handledResult = innerFrom(selector(err, catchError(selector)(source)));
                if (innerSub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    handledResult.subscribe(subscriber);
                }
                else {
                    syncUnsub = true;
                }
            }));
            if (syncUnsub) {
                innerSub.unsubscribe();
                innerSub = null;
                handledResult.subscribe(subscriber);
            }
        });
    }

    function observeOn(scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        return operate(function (source, subscriber) {
            source.subscribe(new OperatorSubscriber(subscriber, function (value) { return executeSchedule(subscriber, scheduler, function () { return subscriber.next(value); }, delay); }, function () { return executeSchedule(subscriber, scheduler, function () { return subscriber.complete(); }, delay); }, function (err) { return executeSchedule(subscriber, scheduler, function () { return subscriber.error(err); }, delay); }));
        });
    }

    function subscribeOn(scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        return operate(function (source, subscriber) {
            subscriber.add(scheduler.schedule(function () { return source.subscribe(subscriber); }, delay));
        });
    }

    function scheduleObservable(input, scheduler) {
        return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
    }

    function schedulePromise(input, scheduler) {
        return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
    }

    function scheduleArray(input, scheduler) {
        return new Observable(function (subscriber) {
            var i = 0;
            return scheduler.schedule(function () {
                if (i === input.length) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(input[i++]);
                    if (!subscriber.closed) {
                        this.schedule();
                    }
                }
            });
        });
    }

    function scheduleIterable(input, scheduler) {
        return new Observable(function (subscriber) {
            var iterator$1;
            executeSchedule(subscriber, scheduler, function () {
                iterator$1 = input[iterator]();
                executeSchedule(subscriber, scheduler, function () {
                    var _a;
                    var value;
                    var done;
                    try {
                        (_a = iterator$1.next(), value = _a.value, done = _a.done);
                    }
                    catch (err) {
                        subscriber.error(err);
                        return;
                    }
                    if (done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(value);
                    }
                }, 0, true);
            });
            return function () { return isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return(); };
        });
    }

    function scheduleAsyncIterable(input, scheduler) {
        if (!input) {
            throw new Error('Iterable cannot be null');
        }
        return new Observable(function (subscriber) {
            executeSchedule(subscriber, scheduler, function () {
                var iterator = input[Symbol.asyncIterator]();
                executeSchedule(subscriber, scheduler, function () {
                    iterator.next().then(function (result) {
                        if (result.done) {
                            subscriber.complete();
                        }
                        else {
                            subscriber.next(result.value);
                        }
                    });
                }, 0, true);
            });
        });
    }

    function scheduleReadableStreamLike(input, scheduler) {
        return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
    }

    function scheduled(input, scheduler) {
        if (input != null) {
            if (isInteropObservable(input)) {
                return scheduleObservable(input, scheduler);
            }
            if (isArrayLike(input)) {
                return scheduleArray(input, scheduler);
            }
            if (isPromise(input)) {
                return schedulePromise(input, scheduler);
            }
            if (isAsyncIterable(input)) {
                return scheduleAsyncIterable(input, scheduler);
            }
            if (isIterable(input)) {
                return scheduleIterable(input, scheduler);
            }
            if (isReadableStreamLike(input)) {
                return scheduleReadableStreamLike(input, scheduler);
            }
        }
        throw createInvalidObservableTypeError(input);
    }

    function from(input, scheduler) {
        return scheduler ? scheduled(input, scheduler) : innerFrom(input);
    }

    function map(project, thisArg) {
        return operate(function (source, subscriber) {
            var index = 0;
            source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                subscriber.next(project.call(thisArg, value, index++));
            }));
        });
    }

    function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalTeardown) {
        var buffer = [];
        var active = 0;
        var index = 0;
        var isComplete = false;
        var checkComplete = function () {
            if (isComplete && !buffer.length && !active) {
                subscriber.complete();
            }
        };
        var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
        var doInnerSub = function (value) {
            expand && subscriber.next(value);
            active++;
            var innerComplete = false;
            innerFrom(project(value, index++)).subscribe(new OperatorSubscriber(subscriber, function (innerValue) {
                onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
                if (expand) {
                    outerNext(innerValue);
                }
                else {
                    subscriber.next(innerValue);
                }
            }, function () {
                innerComplete = true;
            }, undefined, function () {
                if (innerComplete) {
                    try {
                        active--;
                        var _loop_1 = function () {
                            var bufferedValue = buffer.shift();
                            if (innerSubScheduler) {
                                executeSchedule(subscriber, innerSubScheduler, function () { return doInnerSub(bufferedValue); });
                            }
                            else {
                                doInnerSub(bufferedValue);
                            }
                        };
                        while (buffer.length && active < concurrent) {
                            _loop_1();
                        }
                        checkComplete();
                    }
                    catch (err) {
                        subscriber.error(err);
                    }
                }
            }));
        };
        source.subscribe(new OperatorSubscriber(subscriber, outerNext, function () {
            isComplete = true;
            checkComplete();
        }));
        return function () {
            additionalTeardown === null || additionalTeardown === void 0 ? void 0 : additionalTeardown();
        };
    }

    function mergeMap(project, resultSelector, concurrent) {
        if (concurrent === void 0) { concurrent = Infinity; }
        if (isFunction(resultSelector)) {
            return mergeMap(function (a, i) { return map(function (b, ii) { return resultSelector(a, b, i, ii); })(innerFrom(project(a, i))); }, concurrent);
        }
        else if (typeof resultSelector === 'number') {
            concurrent = resultSelector;
        }
        return operate(function (source, subscriber) { return mergeInternals(source, subscriber, project, concurrent); });
    }

    function mergeAll(concurrent) {
        if (concurrent === void 0) { concurrent = Infinity; }
        return mergeMap(identity, concurrent);
    }

    function concatAll() {
        return mergeAll(1);
    }

    function debounceTime(dueTime, scheduler) {
        if (scheduler === void 0) { scheduler = asyncScheduler; }
        return operate(function (source, subscriber) {
            var activeTask = null;
            var lastValue = null;
            var lastTime = null;
            var emit = function () {
                if (activeTask) {
                    activeTask.unsubscribe();
                    activeTask = null;
                    var value = lastValue;
                    lastValue = null;
                    subscriber.next(value);
                }
            };
            function emitWhenIdle() {
                var targetTime = lastTime + dueTime;
                var now = scheduler.now();
                if (now < targetTime) {
                    activeTask = this.schedule(undefined, targetTime - now);
                    subscriber.add(activeTask);
                    return;
                }
                emit();
            }
            source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                lastValue = value;
                lastTime = scheduler.now();
                if (!activeTask) {
                    activeTask = scheduler.schedule(emitWhenIdle, dueTime);
                    subscriber.add(activeTask);
                }
            }, function () {
                emit();
                subscriber.complete();
            }, undefined, function () {
                lastValue = activeTask = null;
            }));
        });
    }

    function concat$1() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return concatAll()(from(args, popScheduler(args)));
    }

    var EMPTY = new Observable(function (subscriber) { return subscriber.complete(); });

    function take(count) {
        return count <= 0
            ?
                function () { return EMPTY; }
            : operate(function (source, subscriber) {
                var seen = 0;
                source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                    if (++seen <= count) {
                        subscriber.next(value);
                        if (count <= seen) {
                            subscriber.complete();
                        }
                    }
                }));
            });
    }

    function ignoreElements() {
        return operate(function (source, subscriber) {
            source.subscribe(new OperatorSubscriber(subscriber, noop));
        });
    }

    function mapTo(value) {
        return map(function () { return value; });
    }

    function delayWhen(delayDurationSelector, subscriptionDelay) {
        if (subscriptionDelay) {
            return function (source) {
                return concat$1(subscriptionDelay.pipe(take(1), ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
            };
        }
        return mergeMap(function (value, index) { return delayDurationSelector(value, index).pipe(take(1), mapTo(value)); });
    }

    function delay(due, scheduler) {
        if (scheduler === void 0) { scheduler = asyncScheduler; }
        var duration = timer(due, scheduler);
        return delayWhen(function () { return duration; });
    }

    function distinctUntilChanged(comparator, keySelector) {
        if (keySelector === void 0) { keySelector = identity; }
        comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
        return operate(function (source, subscriber) {
            var previousKey;
            var first = true;
            source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                var currentKey = keySelector(value);
                if (first || !comparator(previousKey, currentKey)) {
                    first = false;
                    previousKey = currentKey;
                    subscriber.next(value);
                }
            }));
        });
    }
    function defaultCompare(a, b) {
        return a === b;
    }

    function filter(predicate, thisArg) {
        return operate(function (source, subscriber) {
            var index = 0;
            source.subscribe(new OperatorSubscriber(subscriber, function (value) { return predicate.call(thisArg, value, index++) && subscriber.next(value); }));
        });
    }

    function skip(count) {
        return filter(function (_, index) { return count <= index; });
    }

    function startWith() {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        var scheduler = popScheduler(values);
        return operate(function (source, subscriber) {
            (scheduler ? concat$1(values, source, scheduler) : concat$1(values, source)).subscribe(subscriber);
        });
    }

    function switchMap(project, resultSelector) {
        return operate(function (source, subscriber) {
            var innerSubscriber = null;
            var index = 0;
            var isComplete = false;
            var checkComplete = function () { return isComplete && !innerSubscriber && subscriber.complete(); };
            source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
                var innerIndex = 0;
                var outerIndex = index++;
                innerFrom(project(value, outerIndex)).subscribe((innerSubscriber = new OperatorSubscriber(subscriber, function (innerValue) { return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue); }, function () {
                    innerSubscriber = null;
                    checkComplete();
                })));
            }, function () {
                isComplete = true;
                checkComplete();
            }));
        });
    }

    function tap(observerOrNext, error, complete) {
        var tapObserver = isFunction(observerOrNext) || error || complete
            ?
                { next: observerOrNext, error: error, complete: complete }
            : observerOrNext;
        return tapObserver
            ? operate(function (source, subscriber) {
                var _a;
                (_a = tapObserver.subscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                var isUnsub = true;
                source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                    var _a;
                    (_a = tapObserver.next) === null || _a === void 0 ? void 0 : _a.call(tapObserver, value);
                    subscriber.next(value);
                }, function () {
                    var _a;
                    isUnsub = false;
                    (_a = tapObserver.complete) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                    subscriber.complete();
                }, function (err) {
                    var _a;
                    isUnsub = false;
                    (_a = tapObserver.error) === null || _a === void 0 ? void 0 : _a.call(tapObserver, err);
                    subscriber.error(err);
                }, function () {
                    var _a, _b;
                    if (isUnsub) {
                        (_a = tapObserver.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                    }
                    (_b = tapObserver.finalize) === null || _b === void 0 ? void 0 : _b.call(tapObserver);
                }));
            })
            :
                identity;
    }

    var TimeoutError = createErrorClass(function (_super) {
        return function TimeoutErrorImpl(info) {
            if (info === void 0) { info = null; }
            _super(this);
            this.message = 'Timeout has occurred';
            this.name = 'TimeoutError';
            this.info = info;
        };
    });
    function timeout(config, schedulerArg) {
        var _a = (isValidDate(config)
            ? { first: config }
            : typeof config === 'number'
                ? { each: config }
                : config), first = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
        if (first == null && each == null) {
            throw new TypeError('No timeout provided.');
        }
        return operate(function (source, subscriber) {
            var originalSourceSubscription;
            var timerSubscription;
            var lastValue = null;
            var seen = 0;
            var startTimer = function (delay) {
                timerSubscription = executeSchedule(subscriber, scheduler, function () {
                    try {
                        originalSourceSubscription.unsubscribe();
                        innerFrom(_with({
                            meta: meta,
                            lastValue: lastValue,
                            seen: seen,
                        })).subscribe(subscriber);
                    }
                    catch (err) {
                        subscriber.error(err);
                    }
                }, delay);
            };
            originalSourceSubscription = source.subscribe(new OperatorSubscriber(subscriber, function (value) {
                timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
                seen++;
                subscriber.next((lastValue = value));
                each > 0 && startTimer(each);
            }, undefined, undefined, function () {
                if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
                    timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
                }
                lastValue = null;
            }));
            startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler.now()) : each);
        });
    }
    function timeoutErrorFactory(info) {
        throw new TimeoutError(info);
    }

    //const hasSW = 'serviceWorker' in navigator;
    let hasComplainedAboutSyncEvent = false;
    function registerSyncEvent(db, purpose) {
        return __awaiter$1(this, void 0, void 0, function* () {
            try {
                // Send sync event to SW:
                const sw = yield navigator.serviceWorker.ready;
                if (purpose === "push" && sw.sync) {
                    yield sw.sync.register(`dexie-cloud:${db.name}`);
                }
                if (sw.active) {
                    // Use postMessage for pull syncs and for browsers not supporting sync event (Firefox, Safari).
                    // Also chromium based browsers with sw.sync as a fallback for sleepy sync events not taking action for a while.
                    sw.active.postMessage({
                        type: 'dexie-cloud-sync',
                        dbName: db.name,
                        purpose
                    });
                }
                else {
                    throw new Error(`Failed to trigger sync - there's no active service worker`);
                }
                return;
            }
            catch (e) {
                if (!hasComplainedAboutSyncEvent) {
                    console.debug(`Dexie Cloud: Could not register sync event`, e);
                    hasComplainedAboutSyncEvent = true;
                }
            }
        });
    }
    function registerPeriodicSyncEvent(db) {
        var _a;
        return __awaiter$1(this, void 0, void 0, function* () {
            try {
                // Register periodicSync event to SW:
                // @ts-ignore
                const { periodicSync } = yield navigator.serviceWorker.ready;
                if (periodicSync) {
                    try {
                        yield periodicSync.register(`dexie-cloud:${db.name}`, (_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.periodicSync);
                        console.debug(`Dexie Cloud: Successfully registered periodicsync event for ${db.name}`);
                    }
                    catch (e) {
                        console.debug(`Dexie Cloud: Failed to register periodic sync. Your PWA must be installed to allow background sync.`, e);
                    }
                }
                else {
                    console.debug(`Dexie Cloud: periodicSync not supported.`);
                }
            }
            catch (e) {
                console.debug(`Dexie Cloud: Could not register periodicSync for ${db.name}`, e);
            }
        });
    }

    function triggerSync(db, purpose) {
        if (db.cloud.usingServiceWorker) {
            registerSyncEvent(db, purpose);
        }
        else {
            db.localSyncEvent.next({ purpose });
        }
    }

    const b64decode = typeof Buffer !== "undefined"
        ? (base64) => Buffer.from(base64, "base64")
        : (base64) => {
            const binary_string = atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes;
        };
    const b64encode = typeof Buffer !== "undefined"
        ? (b) => ArrayBuffer.isView(b)
            ? Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("base64")
            : Buffer.from(b).toString("base64")
        : (b) => btoa(String.fromCharCode.apply(null, b));

    function computeRealmSetHash({ realms, inviteRealms, }) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const data = JSON.stringify([
                ...realms.map((realmId) => ({ realmId, accepted: true })),
                ...inviteRealms.map((realmId) => ({ realmId, accepted: false })),
            ].sort((a, b) => a.realmId < b.realmId ? -1 : a.realmId > b.realmId ? 1 : 0));
            const byteArray = new TextEncoder().encode(data);
            const digestBytes = yield crypto.subtle.digest('SHA-1', byteArray);
            const base64 = b64encode(digestBytes);
            return base64;
        });
    }

    function getSyncableTables(db) {
        return Object.entries(db.cloud.schema || {})
            .filter(([, { markedForSync }]) => markedForSync)
            .map(([tbl]) => db.tables.filter(({ name }) => name === tbl)[0])
            .filter(cloudTableSchema => cloudTableSchema);
    }

    function getMutationTable(tableName) {
        return `$${tableName}_mutations`;
    }

    function getTableFromMutationTable(mutationTable) {
        var _a;
        const tableName = (_a = /^\$(.*)_mutations$/.exec(mutationTable)) === null || _a === void 0 ? void 0 : _a[1];
        if (!tableName)
            throw new Error(`Given mutationTable ${mutationTable} is not correct`);
        return tableName;
    }

    const concat = [].concat;
    function flatten(a) {
        return concat.apply([], a);
    }

    function listClientChanges(mutationTables, db, { since = {}, limit = Infinity } = {}) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const allMutsOnTables = yield Promise.all(mutationTables.map((mutationTable) => __awaiter$1(this, void 0, void 0, function* () {
                const tableName = getTableFromMutationTable(mutationTable.name);
                const lastRevision = since[tableName];
                let query = lastRevision
                    ? mutationTable.where('rev').above(lastRevision)
                    : mutationTable;
                if (limit < Infinity)
                    query = query.limit(limit);
                const muts = yield query.toArray();
                //const objTable = db.table(tableName);
                /*for (const mut of muts) {
                  if (mut.type === "insert" || mut.type === "upsert") {
                    mut.values = await objTable.bulkGet(mut.keys);
                  }
                }*/
                return muts.map((mut) => ({
                    table: tableName,
                    mut,
                }));
            })));
            // Sort by time to get a true order of the operations (between tables)
            const sorted = flatten(allMutsOnTables).sort((a, b) => a.mut.ts - b.mut.ts);
            const result = [];
            let currentEntry = null;
            let currentTxid = null;
            for (const { table, mut } of sorted) {
                if (currentEntry &&
                    currentEntry.table === table &&
                    currentTxid === mut.txid) {
                    currentEntry.muts.push(mut);
                }
                else {
                    currentEntry = {
                        table,
                        muts: [mut],
                    };
                    currentTxid = mut.txid;
                    result.push(currentEntry);
                }
            }
            // Filter out those tables that doesn't have any mutations:
            return result;
        });
    }

    function randomString$1(bytes) {
        const buf = new Uint8Array(bytes);
        crypto.getRandomValues(buf);
        return btoa(String.fromCharCode.apply(null, buf));
    }

    //@ts-check
    const randomFillSync = crypto.getRandomValues;

    function assert(b) {
        if (!b)
            throw new Error('Assertion Failed');
    }
    function setByKeyPath(obj, keyPath, value) {
        if (!obj || keyPath === undefined)
            return;
        if ('isFrozen' in Object && Object.isFrozen(obj))
            return;
        if (typeof keyPath !== 'string' && 'length' in keyPath) {
            assert(typeof value !== 'string' && 'length' in value);
            for (var i = 0, l = keyPath.length; i < l; ++i) {
                setByKeyPath(obj, keyPath[i], value[i]);
            }
        }
        else {
            var period = keyPath.indexOf('.');
            if (period !== -1) {
                var currentKeyPath = keyPath.substr(0, period);
                var remainingKeyPath = keyPath.substr(period + 1);
                if (remainingKeyPath === '')
                    if (value === undefined) {
                        if (Array.isArray(obj)) {
                            if (!isNaN(parseInt(currentKeyPath)))
                                obj.splice(parseInt(currentKeyPath), 1);
                        }
                        else
                            delete obj[currentKeyPath];
                        // @ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                    }
                    else
                        obj[currentKeyPath] = value;
                else {
                    //@ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                    var innerObj = obj[currentKeyPath];
                    //@ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                    if (!innerObj)
                        innerObj = obj[currentKeyPath] = {};
                    setByKeyPath(innerObj, remainingKeyPath, value);
                }
            }
            else {
                if (value === undefined) {
                    if (Array.isArray(obj) && !isNaN(parseInt(keyPath)))
                        // @ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                        obj.splice(keyPath, 1);
                    //@ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                    else
                        delete obj[keyPath];
                    //@ts-ignore: even if currentKeyPath would be numeric string and obj would be array - it works.
                }
                else
                    obj[keyPath] = value;
            }
        }
    }
    const randomString = typeof self === 'undefined' ? (bytes) => {
        // Node
        const buf = Buffer.alloc(bytes);
        randomFillSync(buf);
        return buf.toString("base64");
    } : (bytes) => {
        // Web
        const buf = new Uint8Array(bytes);
        crypto.getRandomValues(buf);
        return btoa(String.fromCharCode.apply(null, buf));
    };

    /** Verifies that given primary key is valid.
     * The reason we narrow validity for valid keys are twofold:
     *  1: Make sure to only support types that can be used as an object index in DBKeyMutationSet.
     *     For example, ArrayBuffer cannot be used (gives "object ArrayBuffer") but Uint8Array can be
     *     used (gives comma-delimited list of included bytes).
     *  2: Avoid using plain numbers and Dates as keys when they are synced, as they are not globally unique.
     *  3: Since we store the key as a VARCHAR server side in current version, try not promote types that stringifies to become very long server side.
     *
     * @param id
     * @returns
     */
    function isValidSyncableID(id) {
        if (typeof id === "string")
            return true;
        //if (validIDTypes[toStringTag(id)]) return true;
        //if (Array.isArray(id)) return id.every((part) => isValidSyncableID(part));
        if (Array.isArray(id) && id.some(key => isValidSyncableID(key)) && id.every(isValidSyncableIDPart))
            return true;
        return false;
    }
    /** Verifies that given key part is valid.
     *  1: Make sure that arrays of this types are stringified correclty and works with DBKeyMutationSet.
     *     For example, ArrayBuffer cannot be used (gives "object ArrayBuffer") but Uint8Array can be
     *     used (gives comma-delimited list of included bytes).
     *  2: Since we store the key as a VARCHAR server side in current version, try not promote types that stringifies to become very long server side.
    */
    function isValidSyncableIDPart(part) {
        return typeof part === "string" || typeof part === "number" || Array.isArray(part) && part.every(isValidSyncableIDPart);
    }
    function isValidAtID(id, idPrefix) {
        return !idPrefix || (typeof id === "string" && id.startsWith(idPrefix));
    }

    function applyOperation(target, table, op) {
        const tbl = target[table] || (target[table] = {});
        const keys = op.keys.map(key => typeof key === 'string' ? key : JSON.stringify(key));
        switch (op.type) {
            case "insert":
            // TODO: Don't treat insert and upsert the same?
            case "upsert":
                keys.forEach((key, idx) => {
                    tbl[key] = {
                        type: "ups",
                        val: op.values[idx],
                    };
                });
                break;
            case "update":
            case "modify": {
                keys.forEach((key, idx) => {
                    const changeSpec = op.type === "update"
                        ? op.changeSpecs[idx]
                        : op.changeSpec;
                    const entry = tbl[key];
                    if (!entry) {
                        tbl[key] = {
                            type: "upd",
                            mod: changeSpec,
                        };
                    }
                    else {
                        switch (entry.type) {
                            case "ups":
                                // Adjust the existing upsert with additional updates
                                for (const [propPath, value] of Object.entries(changeSpec)) {
                                    setByKeyPath(entry.val, propPath, value);
                                }
                                break;
                            case "del":
                                // No action.
                                break;
                            case "upd":
                                // Adjust existing update with additional updates
                                Object.assign(entry.mod, changeSpec); // May work for deep props as well - new keys is added later, right? Does the prop order persist along TSON and all? But it will not be 100% when combined with some server code (seach for "address.city": "Stockholm" comment)
                                break;
                        }
                    }
                });
                break;
            }
            case "delete":
                keys.forEach((key) => {
                    tbl[key] = {
                        type: "del",
                    };
                });
                break;
        }
        return target;
    }

    function applyOperations(target, ops) {
        for (const { table, muts } of ops) {
            for (const mut of muts) {
                applyOperation(target, table, mut);
            }
        }
    }

    function subtractChanges(target, // Server change set
    changesToSubtract // additional mutations on client during syncWithServer()
    ) {
        var _a, _b, _c;
        for (const [table, mutationSet] of Object.entries(changesToSubtract)) {
            for (const [key, mut] of Object.entries(mutationSet)) {
                switch (mut.type) {
                    case 'ups':
                        {
                            const targetMut = (_a = target[table]) === null || _a === void 0 ? void 0 : _a[key];
                            if (targetMut) {
                                switch (targetMut.type) {
                                    case 'ups':
                                        delete target[table][key];
                                        break;
                                    case 'del':
                                        // Leave delete operation.
                                        // (Don't resurrect objects unintenionally (using tx(get, put) pattern locally))
                                        break;
                                    case 'upd':
                                        delete target[table][key];
                                        break;
                                }
                            }
                        }
                        break;
                    case 'del':
                        (_b = target[table]) === null || _b === void 0 ? true : delete _b[key];
                        break;
                    case 'upd': {
                        const targetMut = (_c = target[table]) === null || _c === void 0 ? void 0 : _c[key];
                        if (targetMut) {
                            switch (targetMut.type) {
                                case 'ups':
                                    // Adjust the server upsert with locally updated values.
                                    for (const [propPath, value] of Object.entries(mut.mod)) {
                                        setByKeyPath(targetMut.val, propPath, value);
                                    }
                                    break;
                                case 'del':
                                    // Leave delete.
                                    break;
                                case 'upd':
                                    // Remove the local update props from the server update mutation.
                                    for (const propPath of Object.keys(mut.mod)) {
                                        delete targetMut.mod[propPath];
                                    }
                                    break;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    /** Convert a DBKeyMutationSet (which is an internal format capable of looking up changes per ID)
     * ...into a DBOperationsSet (which is more optimal for performing DB operations into DB (bulkAdd() etc))
     *
     * @param inSet
     * @returns DBOperationsSet representing inSet
     */
    function toDBOperationSet(inSet) {
        // Fictive transaction:
        const txid = randomString(16);
        // Convert data into a temporary map to collect mutations of same table and type
        const map = {};
        for (const [table, ops] of Object.entries(inSet)) {
            for (const [key, op] of Object.entries(ops)) {
                const mapEntry = map[table] || (map[table] = {});
                const ops = mapEntry[op.type] || (mapEntry[op.type] = []);
                ops.push(Object.assign({ key }, op)); // DBKeyMutation doesn't contain key, so we need to bring it in.
            }
        }
        // Start computing the resulting format:
        const result = [];
        for (const [table, ops] of Object.entries(map)) {
            const resultEntry = {
                table,
                muts: [],
            };
            for (const [optype, muts] of Object.entries(ops)) {
                switch (optype) {
                    case "ups": {
                        const op = {
                            type: "upsert",
                            keys: muts.map(mut => mut.key),
                            values: muts.map(mut => mut.val),
                            txid
                        };
                        resultEntry.muts.push(op);
                        break;
                    }
                    case "upd": {
                        const op = {
                            type: "update",
                            keys: muts.map(mut => mut.key),
                            changeSpecs: muts.map(mut => mut.mod),
                            txid
                        };
                        resultEntry.muts.push(op);
                        break;
                    }
                    case "del": {
                        const op = {
                            type: "delete",
                            keys: muts.map(mut => mut.key),
                            txid,
                        };
                        resultEntry.muts.push(op);
                        break;
                    }
                }
            }
            result.push(resultEntry);
        }
        return result;
    }

    function getDbNameFromDbUrl(dbUrl) {
        const url = new URL(dbUrl);
        return url.pathname === "/"
            ? url.hostname.split('.')[0]
            : url.pathname.split('/')[1];
    }

    function listSyncifiedChanges(tablesToSyncify, currentUser, schema, alreadySyncedRealms) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const txid = `upload-${randomString$1(8)}`;
            if (currentUser.isLoggedIn) {
                if (tablesToSyncify.length > 0) {
                    const ignoredRealms = new Set(alreadySyncedRealms || []);
                    const upserts = yield Promise.all(tablesToSyncify.map((table) => __awaiter$1(this, void 0, void 0, function* () {
                        const { extractKey } = table.core.schema.primaryKey;
                        if (!extractKey)
                            return { table: table.name, muts: [] }; // Outbound tables are not synced.
                        const dexieCloudTableSchema = schema[table.name];
                        const query = (dexieCloudTableSchema === null || dexieCloudTableSchema === void 0 ? void 0 : dexieCloudTableSchema.generatedGlobalId)
                            ? table.filter((item) => {
                                const id = extractKey(item);
                                return (!ignoredRealms.has(item.realmId || '') &&
                                    //(id[0] !== '#' || !!item.$ts) && // Private obj need no sync if not changed
                                    isValidSyncableID(id));
                            })
                            : table.filter((item) => {
                                extractKey(item);
                                return (!ignoredRealms.has(item.realmId || '') &&
                                    //(id[0] !== '#' || !!item.$ts) && // Private obj need no sync if not changed
                                    isValidAtID(extractKey(item), dexieCloudTableSchema === null || dexieCloudTableSchema === void 0 ? void 0 : dexieCloudTableSchema.idPrefix));
                            });
                        const unsyncedObjects = yield query.toArray();
                        if (unsyncedObjects.length > 0) {
                            const mut = {
                                type: 'upsert',
                                values: unsyncedObjects,
                                keys: unsyncedObjects.map(extractKey),
                                userId: currentUser.userId,
                                txid,
                            };
                            return {
                                table: table.name,
                                muts: [mut],
                            };
                        }
                        else {
                            return {
                                table: table.name,
                                muts: [],
                            };
                        }
                    })));
                    return upserts.filter((op) => op.muts.length > 0);
                }
            }
            return [];
        });
    }

    function getTablesToSyncify(db, syncState) {
        const syncedTables = (syncState === null || syncState === void 0 ? void 0 : syncState.syncedTables) || [];
        const syncableTables = getSyncableTables(db);
        const tablesToSyncify = syncableTables.filter((tbl) => !syncedTables.includes(tbl.name));
        return tablesToSyncify;
    }

    function interactWithUser(userInteraction, req) {
        let done = false;
        return new Promise((resolve, reject) => {
            const interactionProps = Object.assign(Object.assign({}, req), { onSubmit: (res) => {
                    userInteraction.next(undefined);
                    done = true;
                    resolve(res);
                }, onCancel: () => {
                    userInteraction.next(undefined);
                    done = true;
                    reject(new Dexie__default["default"].AbortError("User cancelled"));
                } });
            userInteraction.next(interactionProps);
            // Start subscribing for external updates to db.cloud.userInteraction, and if so, cancel this request.
            /*const subscription = userInteraction.subscribe((currentInteractionProps) => {
              if (currentInteractionProps !== interactionProps) {
                if (subscription) subscription.unsubscribe();
                if (!done) {
                  reject(new Dexie.AbortError("User cancelled"));
                }
              }
            });*/
        });
    }
    function alertUser(userInteraction, title, ...alerts) {
        return interactWithUser(userInteraction, {
            type: 'message-alert',
            title,
            alerts,
            fields: {}
        });
    }
    function promptForEmail(userInteraction, title, emailHint) {
        return __awaiter$1(this, void 0, void 0, function* () {
            let email = emailHint || '';
            while (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,10}$/.test(email)) {
                email = (yield interactWithUser(userInteraction, {
                    type: 'email',
                    title,
                    alerts: email
                        ? [
                            {
                                type: 'error',
                                messageCode: 'INVALID_EMAIL',
                                message: 'Please enter a valid email address',
                                messageParams: {},
                            },
                        ]
                        : [],
                    fields: {
                        email: {
                            type: 'email',
                            placeholder: 'you@somedomain.com',
                        },
                    },
                })).email;
            }
            return email;
        });
    }
    function promptForOTP(userInteraction, email, alert) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const alerts = [
                {
                    type: 'info',
                    messageCode: 'OTP_SENT',
                    message: `A One-Time password has been sent to {email}`,
                    messageParams: { email },
                },
            ];
            if (alert) {
                alerts.push(alert);
            }
            const { otp } = yield interactWithUser(userInteraction, {
                type: 'otp',
                title: 'Enter OTP',
                alerts,
                fields: {
                    otp: {
                        type: 'otp',
                        label: 'OTP',
                        placeholder: 'Paste OTP here',
                    },
                },
            });
            return otp;
        });
    }

    function loadAccessToken(db) {
        var _a, _b;
        return __awaiter$1(this, void 0, void 0, function* () {
            const currentUser = yield db.getCurrentUser();
            const { accessToken, accessTokenExpiration, refreshToken, refreshTokenExpiration, claims, } = currentUser;
            if (!accessToken)
                return;
            const expTime = (_a = accessTokenExpiration === null || accessTokenExpiration === void 0 ? void 0 : accessTokenExpiration.getTime()) !== null && _a !== void 0 ? _a : Infinity;
            if (expTime > Date.now()) {
                return accessToken;
            }
            if (!refreshToken) {
                throw new Error(`Refresh token missing`);
            }
            const refreshExpTime = (_b = refreshTokenExpiration === null || refreshTokenExpiration === void 0 ? void 0 : refreshTokenExpiration.getTime()) !== null && _b !== void 0 ? _b : Infinity;
            if (refreshExpTime <= Date.now()) {
                throw new Error(`Refresh token has expired`);
            }
            const refreshedLogin = yield refreshAccessToken(db.cloud.options.databaseUrl, currentUser);
            yield db.table('$logins').update(claims.sub, {
                accessToken: refreshedLogin.accessToken,
                accessTokenExpiration: refreshedLogin.accessTokenExpiration,
            });
            return refreshedLogin.accessToken;
        });
    }
    function authenticate(url, context, fetchToken, userInteraction, hints) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (context.accessToken &&
                context.accessTokenExpiration.getTime() > Date.now()) {
                return context;
            }
            else if (context.refreshToken &&
                (!context.refreshTokenExpiration ||
                    context.refreshTokenExpiration.getTime() > Date.now())) {
                return yield refreshAccessToken(url, context);
            }
            else {
                return yield userAuthenticate(context, fetchToken, userInteraction, hints);
            }
        });
    }
    function refreshAccessToken(url, login) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (!login.refreshToken)
                throw new Error(`Cannot refresh token - refresh token is missing.`);
            if (!login.nonExportablePrivateKey)
                throw new Error(`login.nonExportablePrivateKey is missing - cannot sign refresh token without a private key.`);
            const time_stamp = Date.now();
            const signing_algorithm = 'RSASSA-PKCS1-v1_5';
            const textEncoder = new TextEncoder();
            const data = textEncoder.encode(login.refreshToken + time_stamp);
            const binarySignature = yield crypto.subtle.sign(signing_algorithm, login.nonExportablePrivateKey, data);
            const signature = b64encode(binarySignature);
            const tokenRequest = {
                grant_type: 'refresh_token',
                refresh_token: login.refreshToken,
                scopes: ['ACCESS_DB'],
                signature,
                signing_algorithm,
                time_stamp,
            };
            const res = yield fetch(`${url}/token`, {
                body: JSON.stringify(tokenRequest),
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
            });
            if (res.status !== 200)
                throw new Error(`RefreshToken: Status ${res.status} from ${url}/token`);
            const response = yield res.json();
            login.accessToken = response.accessToken;
            login.accessTokenExpiration = response.accessTokenExpiration
                ? new Date(response.accessTokenExpiration)
                : undefined;
            return login;
        });
    }
    function userAuthenticate(context, fetchToken, userInteraction, hints) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const { privateKey, publicKey } = yield crypto.subtle.generateKey({
                name: 'RSASSA-PKCS1-v1_5',
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: { name: 'SHA-256' },
            }, false, // Non-exportable...
            ['sign', 'verify']);
            if (!privateKey || !publicKey)
                throw new Error(`Could not generate RSA keypair`); // Typings suggest these can be undefined...
            context.nonExportablePrivateKey = privateKey; //...but storable!
            const publicKeySPKI = yield crypto.subtle.exportKey('spki', publicKey);
            const publicKeyPEM = spkiToPEM(publicKeySPKI);
            context.publicKey = publicKey;
            try {
                const response2 = yield fetchToken({
                    public_key: publicKeyPEM,
                    hints,
                });
                if (response2.type !== 'tokens')
                    throw new Error(`Unexpected response type from token endpoint: ${response2.type}`);
                context.accessToken = response2.accessToken;
                context.accessTokenExpiration = new Date(response2.accessTokenExpiration);
                context.refreshToken = response2.refreshToken;
                if (response2.refreshTokenExpiration) {
                    context.refreshTokenExpiration = new Date(response2.refreshTokenExpiration);
                }
                context.userId = response2.claims.sub;
                context.email = response2.claims.email;
                context.name = response2.claims.name;
                context.claims = response2.claims;
                if (response2.alerts && response2.alerts.length > 0) {
                    yield interactWithUser(userInteraction, {
                        type: 'message-alert',
                        title: 'Authentication Alert',
                        fields: {},
                        alerts: response2.alerts,
                    });
                }
                return context;
            }
            catch (error) {
                yield alertUser(userInteraction, 'Authentication Failed', {
                    type: 'error',
                    messageCode: 'GENERIC_ERROR',
                    message: `We're having a problem authenticating right now.`,
                    messageParams: {}
                }).catch(() => { });
                throw error;
            }
        });
    }
    function spkiToPEM(keydata) {
        const keydataB64 = b64encode(keydata);
        const keydataB64Pem = formatAsPem(keydataB64);
        return keydataB64Pem;
    }
    function formatAsPem(str) {
        let finalString = '-----BEGIN PUBLIC KEY-----\n';
        while (str.length > 0) {
            finalString += str.substring(0, 64) + '\n';
            str = str.substring(64);
        }
        finalString = finalString + '-----END PUBLIC KEY-----';
        return finalString;
    }

    const { toString: toStr } = {};
    function getToStringTag(val) {
        return toStr.call(val).slice(8, -1);
    }
    function escapeDollarProps(value) {
        const keys = Object.keys(value);
        let dollarKeys = null;
        for (let i = 0, l = keys.length; i < l; ++i) {
            if (keys[i][0] === "$") {
                dollarKeys = dollarKeys || [];
                dollarKeys.push(keys[i]);
            }
        }
        if (!dollarKeys)
            return value;
        const clone = { ...value };
        for (const k of dollarKeys) {
            delete clone[k];
        }
        for (const k of dollarKeys) {
            clone["$" + k] = value[k];
        }
        return clone;
    }
    const ObjectDef = {
        replace: escapeDollarProps,
    };
    function TypesonSimplified(...typeDefsInputs) {
        const typeDefs = typeDefsInputs.reduce((p, c) => ({ ...p, ...c }), typeDefsInputs.reduce((p, c) => ({ ...c, ...p }), {}));
        const protoMap = new WeakMap();
        return {
            stringify(value, alternateChannel, space) {
                const json = JSON.stringify(value, function (key) {
                    const realVal = this[key];
                    const typeDef = getTypeDef(realVal);
                    return typeDef
                        ? typeDef.replace(realVal, alternateChannel, typeDefs)
                        : realVal;
                }, space);
                return json;
            },
            parse(tson, alternateChannel) {
                const stack = [];
                return JSON.parse(tson, function (key, value) {
                    //
                    // Parent Part
                    //
                    const type = value === null || value === void 0 ? void 0 : value.$t;
                    if (type) {
                        const typeDef = typeDefs[type];
                        value = typeDef
                            ? typeDef.revive(value, alternateChannel, typeDefs)
                            : value;
                    }
                    let top = stack[stack.length - 1];
                    if (top && top[0] === value) {
                        // Do what the kid told us to
                        // Unescape dollar props
                        value = { ...value };
                        // Delete keys that children wanted us to delete
                        for (const k of top[1])
                            delete value[k];
                        // Set keys that children wanted us to set
                        for (const [k, v] of Object.entries(top[2])) {
                            value[k] = v;
                        }
                        stack.pop();
                    }
                    //
                    // Child part
                    //
                    if (value === undefined || (key[0] === "$" && key !== "$t")) {
                        top = stack[stack.length - 1];
                        let deletes;
                        let mods;
                        if (top && top[0] === this) {
                            deletes = top[1];
                            mods = top[2];
                        }
                        else {
                            stack.push([this, (deletes = []), (mods = {})]);
                        }
                        if (key[0] === "$" && key !== "$t") {
                            // Unescape props (also preserves undefined if this is a combo)
                            deletes.push(key);
                            mods[key.substr(1)] = value;
                        }
                        else {
                            // Preserve undefined
                            mods[key] = undefined;
                        }
                    }
                    return value;
                });
            },
        };
        function getTypeDef(realVal) {
            const type = typeof realVal;
            switch (typeof realVal) {
                case "object":
                case "function": {
                    // "object", "function", null
                    if (realVal === null)
                        return null;
                    const proto = Object.getPrototypeOf(realVal);
                    if (!proto)
                        return ObjectDef;
                    let typeDef = protoMap.get(proto);
                    if (typeDef !== undefined)
                        return typeDef; // Null counts to! So the caching of Array.prototype also counts.
                    const toStringTag = getToStringTag(realVal);
                    const entry = Object.entries(typeDefs).find(([typeName, typeDef]) => { var _a, _b; return (_b = (_a = typeDef === null || typeDef === void 0 ? void 0 : typeDef.test) === null || _a === void 0 ? void 0 : _a.call(typeDef, realVal, toStringTag)) !== null && _b !== void 0 ? _b : typeName === toStringTag; });
                    typeDef = entry === null || entry === void 0 ? void 0 : entry[1];
                    if (!typeDef) {
                        typeDef = Array.isArray(realVal)
                            ? null
                            : typeof realVal === "function"
                                ? typeDefs.function || null
                                : ObjectDef;
                    }
                    protoMap.set(proto, typeDef);
                    return typeDef;
                }
                default:
                    return typeDefs[type];
            }
        }
    }

    const BisonBinaryTypes = {
        Blob: {
            test: (blob, toStringTag) => toStringTag === "Blob",
            replace: (blob, altChannel) => {
                const i = altChannel.length;
                altChannel.push(blob);
                return {
                    $t: "Blob",
                    mimeType: blob.type,
                    i,
                };
            },
            revive: ({ i, mimeType }, altChannel) => new Blob([altChannel[i]], { type: mimeType }),
        },
    };

    var numberDef = {
        number: {
            replace: (num) => {
                switch (true) {
                    case isNaN(num):
                        return { $t: "number", v: "NaN" };
                    case num === Infinity:
                        return { $t: "number", v: "Infinity" };
                    case num === -Infinity:
                        return { $t: "number", v: "-Infinity" };
                    default:
                        return num;
                }
            },
            revive: ({ v }) => Number(v),
        },
    };

    const bigIntDef = {
        bigint: {
            replace: (realVal) => {
                return { $t: "bigint", v: "" + realVal };
            },
            revive: (obj) => BigInt(obj.v),
        },
    };

    var DateDef = {
        Date: {
            replace: (date) => ({
                $t: "Date",
                v: isNaN(date.getTime()) ? "NaN" : date.toISOString(),
            }),
            revive: ({ v }) => new Date(v === "NaN" ? NaN : Date.parse(v)),
        },
    };

    var SetDef = {
        Set: {
            replace: (set) => ({
                $t: "Set",
                v: Array.from(set.entries()),
            }),
            revive: ({ v }) => new Set(v),
        },
    };

    var MapDef = {
        Map: {
            replace: (map) => ({
                $t: "Map",
                v: Array.from(map.entries()),
            }),
            revive: ({ v }) => new Map(v),
        },
    };

    const _global = typeof globalThis !== "undefined"
        ? globalThis
        : typeof self !== "undefined"
            ? self
            : typeof global === "undefined"
                ? global
                : undefined;

    var TypedArraysDefs = [
        "Int8Array",
        "Uint8Array",
        "Uint8ClampedArray",
        "Int16Array",
        "Uint16Array",
        "Int32Array",
        "Uint32Array",
        "Float32Array",
        "Float64Array",
        "DataView",
        "BigInt64Array",
        "BigUint64Array",
    ].reduce((specs, typeName) => ({
        ...specs,
        [typeName]: {
            // Replace passes the the typed array into $t, buffer so that
            // the ArrayBuffer typedef takes care of further handling of the buffer:
            // {$t:"Uint8Array",buffer:{$t:"ArrayBuffer",idx:0}}
            // CHANGED ABOVE! Now shortcutting that for more sparse format of the typed arrays
            // to contain the b64 property directly.
            replace: (a, _, typeDefs) => {
                const result = {
                    $t: typeName,
                    v: typeDefs.ArrayBuffer.replace(a.byteOffset === 0 && a.byteLength === a.buffer.byteLength
                        ? a.buffer
                        : a.buffer.slice(a.byteOffset, a.byteOffset + a.byteLength), _, typeDefs).v,
                };
                return result;
            },
            revive: ({ v }, _, typeDefs) => {
                const TypedArray = _global[typeName];
                return (TypedArray &&
                    new TypedArray(typeDefs.ArrayBuffer.revive({ v }, _, typeDefs)));
            },
        },
    }), {});

    function b64LexEncode(b) {
        return b64ToLex(b64encode(b));
    }
    function b64LexDecode(b64Lex) {
        return b64decode(lexToB64(b64Lex));
    }
    function b64ToLex(base64) {
        var encoded = "";
        for (var i = 0, length = base64.length; i < length; i++) {
            encoded += ENCODE_TABLE[base64[i]];
        }
        return encoded;
    }
    function lexToB64(base64lex) {
        // only accept string input
        if (typeof base64lex !== "string") {
            throw new Error("invalid decoder input: " + base64lex);
        }
        var base64 = "";
        for (var i = 0, length = base64lex.length; i < length; i++) {
            base64 += DECODE_TABLE[base64lex[i]];
        }
        return base64;
    }
    const DECODE_TABLE = {
        "-": "=",
        "0": "A",
        "1": "B",
        "2": "C",
        "3": "D",
        "4": "E",
        "5": "F",
        "6": "G",
        "7": "H",
        "8": "I",
        "9": "J",
        A: "K",
        B: "L",
        C: "M",
        D: "N",
        E: "O",
        F: "P",
        G: "Q",
        H: "R",
        I: "S",
        J: "T",
        K: "U",
        L: "V",
        M: "W",
        N: "X",
        O: "Y",
        P: "Z",
        Q: "a",
        R: "b",
        S: "c",
        T: "d",
        U: "e",
        V: "f",
        W: "g",
        X: "h",
        Y: "i",
        Z: "j",
        _: "k",
        a: "l",
        b: "m",
        c: "n",
        d: "o",
        e: "p",
        f: "q",
        g: "r",
        h: "s",
        i: "t",
        j: "u",
        k: "v",
        l: "w",
        m: "x",
        n: "y",
        o: "z",
        p: "0",
        q: "1",
        r: "2",
        s: "3",
        t: "4",
        u: "5",
        v: "6",
        w: "7",
        x: "8",
        y: "9",
        z: "+",
        "|": "/",
    };
    const ENCODE_TABLE = {};
    for (const c of Object.keys(DECODE_TABLE)) {
        ENCODE_TABLE[DECODE_TABLE[c]] = c;
    }

    var ArrayBufferDef = {
        ArrayBuffer: {
            replace: (ab) => ({
                $t: "ArrayBuffer",
                v: b64LexEncode(ab),
            }),
            revive: ({ v }) => {
                const ba = b64LexDecode(v);
                return ba.buffer.byteLength === ba.byteLength
                    ? ba.buffer
                    : ba.buffer.slice(ba.byteOffset, ba.byteOffset + ba.byteLength);
            },
        },
    };

    class FakeBlob {
        constructor(buf, type) {
            this.buf = buf;
            this.type = type;
        }
    }

    function readBlobSync(b) {
        const req = new XMLHttpRequest();
        req.overrideMimeType("text/plain; charset=x-user-defined");
        req.open("GET", URL.createObjectURL(b), false); // Sync
        req.send();
        if (req.status !== 200 && req.status !== 0) {
            throw new Error("Bad Blob access: " + req.status);
        }
        return req.responseText;
    }

    function string2ArrayBuffer(str) {
        const array = new Uint8Array(str.length);
        for (let i = 0; i < str.length; ++i) {
            array[i] = str.charCodeAt(i); // & 0xff;
        }
        return array.buffer;
    }

    var BlobDef = {
        Blob: {
            test: (blob, toStringTag) => toStringTag === "Blob" || blob instanceof FakeBlob,
            replace: (blob) => ({
                $t: "Blob",
                v: blob instanceof FakeBlob
                    ? b64encode(blob.buf)
                    : b64encode(string2ArrayBuffer(readBlobSync(blob))),
                type: blob.type,
            }),
            revive: ({ type, v }) => {
                const ab = b64decode(v);
                return typeof Blob !== undefined
                    ? new Blob([ab])
                    : new FakeBlob(ab.buffer, type);
            },
        },
    };

    const builtin = {
        ...numberDef,
        ...bigIntDef,
        ...DateDef,
        ...SetDef,
        ...MapDef,
        ...TypedArraysDefs,
        ...ArrayBufferDef,
        ...BlobDef,
    };

    function Bison(...typeDefsInputs) {
        const tson = TypesonSimplified(builtin, BisonBinaryTypes, ...typeDefsInputs);
        return {
            toBinary(value) {
                const [blob, json] = this.stringify(value);
                const lenBuf = new ArrayBuffer(4);
                new DataView(lenBuf).setUint32(0, blob.size);
                return new Blob([lenBuf, blob, json]);
            },
            stringify(value) {
                const binaries = [];
                const json = tson.stringify(value, binaries);
                const blob = new Blob(binaries.map((b) => {
                    const lenBuf = new ArrayBuffer(4);
                    new DataView(lenBuf).setUint32(0, "byteLength" in b ? b.byteLength : b.size);
                    return new Blob([lenBuf, b]);
                }));
                return [blob, json];
            },
            async parse(json, binData) {
                let pos = 0;
                const arrayBuffers = [];
                const buf = await readBlobBinary(binData);
                const view = new DataView(buf);
                while (pos < buf.byteLength) {
                    const len = view.getUint32(pos);
                    pos += 4;
                    const ab = buf.slice(pos, pos + len);
                    pos += len;
                    arrayBuffers.push(ab);
                }
                return tson.parse(json, arrayBuffers);
            },
            async fromBinary(blob) {
                const len = new DataView(await readBlobBinary(blob.slice(0, 4))).getUint32(0);
                const binData = blob.slice(4, len + 4);
                const json = await readBlob(blob.slice(len + 4));
                return await this.parse(json, binData);
            },
        };
    }
    function readBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onabort = (ev) => reject(new Error("file read aborted"));
            reader.onerror = (ev) => reject(ev.target.error);
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsText(blob);
        });
    }
    function readBlobBinary(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onabort = (ev) => reject(new Error("file read aborted"));
            reader.onerror = (ev) => reject(ev.target.error);
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsArrayBuffer(blob);
        });
    }

    /** The undefined type is not part of builtin but can be manually added.
     * The reason for supporting undefined is if the following object should be revived correctly:
     *
     *    {foo: undefined}
     *
     * Without including this typedef, the revived object would just be {}.
     * If including this typedef, the revived object would be {foo: undefined}.
     */
    var undefinedDef = {
        undefined: {
            replace: () => ({
                $t: "undefined"
            }),
            revive: () => undefined,
        },
    };

    // Since server revisions are stored in bigints, we need to handle clients without
    // bigint support to not fail when serverRevision is passed over to client.
    // We need to not fail when reviving it and we need to somehow store the information.
    // Since the revived version will later on be put into indexedDB we have another
    // issue: When reading it back from indexedDB we will get a poco object that we
    // cannot replace correctly when sending it to server. So we will also need
    // to do an explicit workaround in the protocol where a bigint is supported.
    // The workaround should be there regardless if browser supports BigInt or not, because
    // the serverRev might have been stored in IDB before the browser was upgraded to support bigint.
    //
    // if (typeof serverRev.rev !== "bigint")
    //   if (hasBigIntSupport)
    //     serverRev.rev = bigIntDef.bigint.revive(server.rev)
    //   else
    //     serverRev.rev = new FakeBigInt(server.rev)
    const hasBigIntSupport = typeof BigInt(0) === 'bigint';
    class FakeBigInt {
        constructor(value) {
            this.v = value;
        }
        toString() {
            return this.v;
        }
    }
    const defs = Object.assign(Object.assign({}, undefinedDef), (hasBigIntSupport
        ? {}
        : {
            bigint: {
                test: (val) => val instanceof FakeBigInt,
                replace: (fakeBigInt) => {
                    return Object.assign({ $t: 'bigint' }, fakeBigInt);
                },
                revive: ({ v, }) => new FakeBigInt(v)
            }
        }));
    const TSON = TypesonSimplified(builtin, defs);
    const BISON = Bison(defs);

    class HttpError extends Error {
        constructor(res, message) {
            super(message || `${res.status} ${res.statusText}`);
            this.httpStatus = res.status;
        }
        get name() {
            return "HttpError";
        }
    }

    function encodeIdsForServer(schema, currentUser, changes) {
        const rv = [];
        for (let change of changes) {
            const { table, muts } = change;
            const tableSchema = schema.tables.find((t) => t.name === table);
            if (!tableSchema)
                throw new Error(`Internal error: table ${table} not found in DBCore schema`);
            const { primaryKey } = tableSchema;
            let changeClone = change;
            muts.forEach((mut, mutIndex) => {
                const rewriteValues = !primaryKey.outbound &&
                    (mut.type === 'upsert' || mut.type === 'insert');
                mut.keys.forEach((key, keyIndex) => {
                    if (Array.isArray(key)) {
                        // Server only support string keys. Dexie Cloud client support strings or array of strings.
                        if (changeClone === change)
                            changeClone = cloneChange(change, rewriteValues);
                        const mutClone = changeClone.muts[mutIndex];
                        const rewrittenKey = JSON.stringify(key);
                        mutClone.keys[keyIndex] = rewrittenKey;
                        if (rewriteValues) {
                            Dexie__default["default"].setByKeyPath(mutClone.values[keyIndex], primaryKey.keyPath, rewrittenKey);
                        }
                    }
                    else if (key[0] === '#') {
                        // Private ID - translate!
                        if (changeClone === change)
                            changeClone = cloneChange(change, rewriteValues);
                        const mutClone = changeClone.muts[mutIndex];
                        if (!currentUser.isLoggedIn)
                            throw new Error(`Internal error: Cannot sync private IDs before authenticated`);
                        const rewrittenKey = `${key}:${currentUser.userId}`;
                        mutClone.keys[keyIndex] = rewrittenKey;
                        if (rewriteValues) {
                            Dexie__default["default"].setByKeyPath(mutClone.values[keyIndex], primaryKey.keyPath, rewrittenKey);
                        }
                    }
                });
            });
            rv.push(changeClone);
        }
        return rv;
    }
    function cloneChange(change, rewriteValues) {
        // clone on demand:
        return Object.assign(Object.assign({}, change), { muts: rewriteValues
                ? change.muts.map((m) => (Object.assign(Object.assign({}, m), { keys: m.keys.slice(), values: m.values.slice() })))
                : change.muts.map((m) => (Object.assign(Object.assign({}, m), { keys: m.keys.slice() }))) });
    }

    //import {BisonWebStreamReader} from "dreambase-library/dist/typeson-simplified/BisonWebStreamReader";
    function syncWithServer(changes, syncState, baseRevs, db, databaseUrl, schema, clientIdentity, currentUser) {
        return __awaiter$1(this, void 0, void 0, function* () {
            //
            // Push changes to server using fetch
            //
            const headers = {
                Accept: 'application/json, application/x-bison, application/x-bison-stream',
                'Content-Type': 'application/tson'
            };
            const accessToken = yield loadAccessToken(db);
            if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
            }
            const syncRequest = {
                v: 2,
                dbID: syncState === null || syncState === void 0 ? void 0 : syncState.remoteDbId,
                clientIdentity,
                schema: schema || {},
                lastPull: syncState ? {
                    serverRevision: syncState.serverRevision,
                    realms: syncState.realms,
                    inviteRealms: syncState.inviteRealms
                } : undefined,
                baseRevs,
                changes: encodeIdsForServer(db.dx.core.schema, currentUser, changes)
            };
            console.debug("Sync request", syncRequest);
            db.syncStateChangedEvent.next({
                phase: 'pushing',
            });
            const res = yield fetch(`${databaseUrl}/sync`, {
                method: 'post',
                headers,
                body: TSON.stringify(syncRequest)
            });
            //const contentLength = Number(res.headers.get('content-length'));
            db.syncStateChangedEvent.next({
                phase: 'pulling'
            });
            if (!res.ok) {
                throw new HttpError(res);
            }
            switch (res.headers.get('content-type')) {
                case 'application/x-bison':
                    return BISON.fromBinary(yield res.blob());
                case 'application/x-bison-stream': //return BisonWebStreamReader(BISON, res);
                default:
                case 'application/json': {
                    const text = yield res.text();
                    const syncRes = TSON.parse(text);
                    return syncRes;
                }
            }
        });
    }

    function modifyLocalObjectsWithNewUserId(syncifiedTables, currentUser, alreadySyncedRealms) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const ignoredRealms = new Set(alreadySyncedRealms || []);
            for (const table of syncifiedTables) {
                if (table.name === "members") {
                    // members
                    yield table.toCollection().modify((member) => {
                        if (!ignoredRealms.has(member.realmId) && (!member.userId || member.userId === UNAUTHORIZED_USER.userId)) {
                            member.userId = currentUser.userId;
                        }
                    });
                }
                else if (table.name === "roles") ;
                else if (table.name === "realms") {
                    // realms
                    yield table.toCollection().modify((realm) => {
                        if (!ignoredRealms.has(realm.realmId) && (realm.owner === undefined || realm.owner === UNAUTHORIZED_USER.userId)) {
                            realm.owner = currentUser.userId;
                        }
                    });
                }
                else {
                    // application entities
                    yield table.toCollection().modify((obj) => {
                        if (!obj.realmId || !ignoredRealms.has(obj.realmId)) {
                            if (!obj.owner || obj.owner === UNAUTHORIZED_USER.userId)
                                obj.owner = currentUser.userId;
                            if (!obj.realmId || obj.realmId === UNAUTHORIZED_USER.userId) {
                                obj.realmId = currentUser.userId;
                            }
                        }
                    });
                }
            }
        });
    }

    function throwIfCancelled(cancelToken) {
        if (cancelToken === null || cancelToken === void 0 ? void 0 : cancelToken.cancelled)
            throw new Dexie__default["default"].AbortError(`Operation was cancelled`);
    }

    /* Need this because navigator.onLine seems to say "false" when it is actually online.
      This function relies initially on navigator.onLine but then uses online and offline events
      which seem to be more reliable.
    */
    let isOnline = navigator.onLine;
    self.addEventListener('online', () => isOnline = true);
    self.addEventListener('offline', () => isOnline = false);

    function updateBaseRevs(db, schema, latestRevisions, serverRev) {
        return __awaiter$1(this, void 0, void 0, function* () {
            yield db.$baseRevs.bulkPut(Object.keys(schema)
                .filter((table) => schema[table].markedForSync)
                .map((tableName) => {
                const lastClientRevOnPreviousServerRev = latestRevisions[tableName] || 0;
                return {
                    tableName,
                    clientRev: lastClientRevOnPreviousServerRev + 1,
                    serverRev,
                };
            }));
        });
    }

    function getLatestRevisionsPerTable(clientChangeSet, lastRevisions = {}) {
        for (const { table, muts } of clientChangeSet) {
            const lastRev = muts.length > 0 ? muts[muts.length - 1].rev : null;
            lastRevisions[table] = lastRev || lastRevisions[table] || 0;
        }
        return lastRevisions;
    }

    function bulkUpdate(table, keys, changeSpecs) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const objs = yield table.bulkGet(keys);
            const resultKeys = [];
            const resultObjs = [];
            keys.forEach((key, idx) => {
                const obj = objs[idx];
                if (obj) {
                    for (const [keyPath, value] of Object.entries(changeSpecs[idx])) {
                        if (keyPath === table.schema.primKey.keyPath) {
                            if (Dexie.cmp(value, key) !== 0) {
                                throw new Error(`Cannot change primary key`);
                            }
                        }
                        else {
                            Dexie__default["default"].setByKeyPath(obj, keyPath, value);
                        }
                    }
                    resultKeys.push(key);
                    resultObjs.push(obj);
                }
            });
            yield (table.schema.primKey.keyPath == null
                ? table.bulkPut(resultObjs, resultKeys)
                : table.bulkPut(resultObjs));
        });
    }

    function applyServerChanges(changes, db) {
        return __awaiter$1(this, void 0, void 0, function* () {
            console.debug('Applying server changes', changes, Dexie__default["default"].currentTransaction);
            for (const { table: tableName, muts } of changes) {
                const table = db.table(tableName);
                if (!table)
                    continue; // If server sends changes on a table we don't have, ignore it.
                const { primaryKey } = table.core.schema;
                const keyDecoder = (key) => {
                    switch (key[0]) {
                        case '[':
                            // Decode JSON array
                            if (key.endsWith(']'))
                                try {
                                    // On server, array keys are transformed to JSON string representation
                                    return JSON.parse(key);
                                }
                                catch (_a) { }
                            return key;
                        case '#':
                            // Decode private ID (do the opposite from what's done in encodeIdsForServer())
                            if (key.endsWith(':' + db.cloud.currentUserId)) {
                                return key.substr(0, key.length - db.cloud.currentUserId.length - 1);
                            }
                            return key;
                        default:
                            return key;
                    }
                };
                for (const mut of muts) {
                    const keys = mut.keys.map(keyDecoder);
                    switch (mut.type) {
                        case 'insert':
                            if (primaryKey.outbound) {
                                yield table.bulkAdd(mut.values, keys);
                            }
                            else {
                                keys.forEach((key, i) => {
                                    // Make sure inbound keys are consistent
                                    Dexie__default["default"].setByKeyPath(mut.values[i], primaryKey.keyPath, key);
                                });
                                yield table.bulkAdd(mut.values);
                            }
                            break;
                        case 'upsert':
                            if (primaryKey.outbound) {
                                yield table.bulkPut(mut.values, keys);
                            }
                            else {
                                keys.forEach((key, i) => {
                                    // Make sure inbound keys are consistent
                                    Dexie__default["default"].setByKeyPath(mut.values[i], primaryKey.keyPath, key);
                                });
                                yield table.bulkPut(mut.values);
                            }
                            break;
                        case 'modify':
                            if (keys.length === 1) {
                                yield table.update(keys[0], mut.changeSpec);
                            }
                            else {
                                yield table.where(':id').anyOf(keys).modify(mut.changeSpec);
                            }
                            break;
                        case 'update':
                            yield bulkUpdate(table, keys, mut.changeSpecs);
                            break;
                        case 'delete':
                            yield table.bulkDelete(keys);
                            break;
                    }
                }
            }
        });
    }

    const CURRENT_SYNC_WORKER = 'currentSyncWorker';
    function sync(db, options, schema, syncOptions) {
        return _sync
            .apply(this, arguments)
            .then(() => {
            if (!(syncOptions === null || syncOptions === void 0 ? void 0 : syncOptions.justCheckIfNeeded)) {
                db.syncStateChangedEvent.next({
                    phase: 'in-sync',
                });
            }
        })
            .catch((error) => __awaiter$1(this, void 0, void 0, function* () {
            if (syncOptions === null || syncOptions === void 0 ? void 0 : syncOptions.justCheckIfNeeded)
                return Promise.reject(error); // Just rethrow.
            console.debug('Error from _sync', {
                isOnline,
                syncOptions,
                error,
            });
            if (isOnline &&
                (syncOptions === null || syncOptions === void 0 ? void 0 : syncOptions.retryImmediatelyOnFetchError) &&
                (error === null || error === void 0 ? void 0 : error.name) === 'TypeError' &&
                /fetch/.test(error === null || error === void 0 ? void 0 : error.message)) {
                db.syncStateChangedEvent.next({
                    phase: 'error',
                    error,
                });
                // Retry again in 500 ms but if it fails again, don't retry.
                yield new Promise((resolve) => setTimeout(resolve, 500));
                return yield sync(db, options, schema, Object.assign(Object.assign({}, syncOptions), { retryImmediatelyOnFetchError: false }));
            }
            // Make sure that no matter whether sync() explodes or not,
            // always update the timestamp. Also store the error.
            yield db.$syncState.update('syncState', {
                timestamp: new Date(),
                error: '' + error,
            });
            db.syncStateChangedEvent.next({
                phase: isOnline ? 'error' : 'offline',
                error,
            });
            return Promise.reject(error);
        }));
    }
    function _sync(db, options, schema, { isInitialSync, cancelToken, justCheckIfNeeded, purpose } = {
        isInitialSync: false,
    }) {
        var _a;
        return __awaiter$1(this, void 0, void 0, function* () {
            if (!justCheckIfNeeded) {
                console.debug('SYNC STARTED', { isInitialSync, purpose });
            }
            if (!((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl))
                throw new Error(`Internal error: sync must not be called when no databaseUrl is configured`);
            const { databaseUrl } = options;
            const currentUser = yield db.getCurrentUser(); // Keep same value across entire sync flow:
            const tablesToSync = currentUser.isLoggedIn ? getSyncableTables(db) : [];
            const mutationTables = tablesToSync.map((tbl) => db.table(getMutationTable(tbl.name)));
            // If this is not the initial sync,
            // go through tables that were previously not synced but should now be according to
            // logged in state and the sync table whitelist in db.cloud.options.
            //
            // Prepare for syncification by modifying locally unauthorized objects:
            //
            const persistedSyncState = yield db.getPersistedSyncState();
            const tablesToSyncify = !isInitialSync && currentUser.isLoggedIn
                ? getTablesToSyncify(db, persistedSyncState)
                : [];
            throwIfCancelled(cancelToken);
            const doSyncify = tablesToSyncify.length > 0;
            if (doSyncify) {
                if (justCheckIfNeeded)
                    return true;
                //console.debug('sync doSyncify is true');
                yield db.transaction('rw', tablesToSyncify, (tx) => __awaiter$1(this, void 0, void 0, function* () {
                    // @ts-ignore
                    tx.idbtrans.disableChangeTracking = true;
                    // @ts-ignore
                    tx.idbtrans.disableAccessControl = true; // TODO: Take care of this flag in access control middleware!
                    yield modifyLocalObjectsWithNewUserId(tablesToSyncify, currentUser, persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.realms);
                }));
                throwIfCancelled(cancelToken);
            }
            //
            // List changes to sync
            //
            const [clientChangeSet, syncState, baseRevs] = yield db.transaction('r', db.tables, () => __awaiter$1(this, void 0, void 0, function* () {
                const syncState = yield db.getPersistedSyncState();
                const baseRevs = yield db.$baseRevs.toArray();
                let clientChanges = yield listClientChanges(mutationTables);
                throwIfCancelled(cancelToken);
                if (doSyncify) {
                    const alreadySyncedRealms = [
                        ...((persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.realms) || []),
                        ...((persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.inviteRealms) || []),
                    ];
                    const syncificationInserts = yield listSyncifiedChanges(tablesToSyncify, currentUser, schema, alreadySyncedRealms);
                    throwIfCancelled(cancelToken);
                    clientChanges = clientChanges.concat(syncificationInserts);
                    return [clientChanges, syncState, baseRevs];
                }
                return [clientChanges, syncState, baseRevs];
            }));
            const syncIsNeeded = clientChangeSet.some((set) => set.muts.some((mut) => mut.keys.length > 0));
            if (justCheckIfNeeded) {
                console.debug('Sync is needed:', syncIsNeeded);
                return syncIsNeeded;
            }
            if (purpose === 'push' && !syncIsNeeded) {
                // The purpose of this request was to push changes
                return false;
            }
            const latestRevisions = getLatestRevisionsPerTable(clientChangeSet, syncState === null || syncState === void 0 ? void 0 : syncState.latestRevisions);
            const clientIdentity = (syncState === null || syncState === void 0 ? void 0 : syncState.clientIdentity) || randomString(16);
            //
            // Push changes to server
            //
            throwIfCancelled(cancelToken);
            const res = yield syncWithServer(clientChangeSet, syncState, baseRevs, db, databaseUrl, schema, clientIdentity, currentUser);
            console.debug('Sync response', res);
            //
            // Apply changes locally and clear old change entries:
            //
            const done = yield db.transaction('rw', db.tables, (tx) => __awaiter$1(this, void 0, void 0, function* () {
                // @ts-ignore
                tx.idbtrans.disableChangeTracking = true;
                // @ts-ignore
                tx.idbtrans.disableAccessControl = true; // TODO: Take care of this flag in access control middleware!
                // Update db.cloud.schema from server response.
                // Local schema MAY include a subset of tables, so do not force all tables into local schema.
                for (const tableName of Object.keys(schema)) {
                    if (res.schema[tableName]) {
                        // Write directly into configured schema. This code can only be executed alone.
                        schema[tableName] = res.schema[tableName];
                    }
                }
                yield db.$syncState.put(schema, 'schema');
                // List mutations that happened during our exchange with the server:
                const addedClientChanges = yield listClientChanges(mutationTables, db, {
                    since: latestRevisions,
                });
                //
                // Delete changes now as server has return success
                // (but keep changes that haven't reached server yet)
                //
                for (const mutTable of mutationTables) {
                    const tableName = getTableFromMutationTable(mutTable.name);
                    if (!addedClientChanges.some((ch) => ch.table === tableName && ch.muts.length > 0)) {
                        // No added mutations for this table during the time we sent changes
                        // to the server.
                        // It is therefore safe to clear all changes (which is faster than
                        // deleting a range)
                        yield Promise.all([
                            mutTable.clear(),
                            db.$baseRevs.where({ tableName }).delete(),
                        ]);
                    }
                    else if (latestRevisions[tableName]) {
                        const latestRev = latestRevisions[tableName] || 0;
                        yield Promise.all([
                            mutTable.where('rev').belowOrEqual(latestRev).delete(),
                            db.$baseRevs
                                .where(':id')
                                .between([tableName, -Infinity], [tableName, latestRev + 1], true, true)
                                .reverse()
                                .offset(1) // Keep one entry (the one mapping muts that came during fetch --> previous server revision)
                                .delete(),
                        ]);
                    }
                    else ;
                }
                // Update latestRevisions object according to additional changes:
                getLatestRevisionsPerTable(addedClientChanges, latestRevisions);
                // Update/add new entries into baseRevs map.
                // * On tables without mutations since last serverRevision,
                //   this will update existing entry.
                // * On tables where mutations have been recorded since last
                //   serverRevision, this will create a new entry.
                // The purpose of this operation is to mark a start revision (per table)
                // so that all client-mutations that come after this, will be mapped to current
                // server revision.
                yield updateBaseRevs(db, schema, latestRevisions, res.serverRevision);
                const syncState = yield db.getPersistedSyncState();
                //
                // Delete objects from removed realms
                //
                yield deleteObjectsFromRemovedRealms(db, res, syncState);
                //
                // Update syncState
                //
                const newSyncState = syncState || {
                    syncedTables: [],
                    latestRevisions: {},
                    realms: [],
                    inviteRealms: [],
                    clientIdentity,
                };
                newSyncState.syncedTables = tablesToSync
                    .map((tbl) => tbl.name)
                    .concat(tablesToSyncify.map((tbl) => tbl.name));
                newSyncState.latestRevisions = latestRevisions;
                newSyncState.remoteDbId = res.dbId;
                newSyncState.initiallySynced = true;
                newSyncState.realms = res.realms;
                newSyncState.inviteRealms = res.inviteRealms;
                newSyncState.serverRevision = res.serverRevision;
                newSyncState.timestamp = new Date();
                delete newSyncState.error;
                const filteredChanges = filterServerChangesThroughAddedClientChanges(res.changes, addedClientChanges);
                //
                // apply server changes
                //
                yield applyServerChanges(filteredChanges, db);
                //
                // Update syncState
                //
                db.$syncState.put(newSyncState, 'syncState');
                return addedClientChanges.length === 0;
            }));
            if (!done) {
                console.debug('MORE SYNC NEEDED. Go for it again!');
                return yield _sync(db, options, schema, { isInitialSync, cancelToken });
            }
            console.debug('SYNC DONE', { isInitialSync });
            return false; // Not needed anymore
        });
    }
    function deleteObjectsFromRemovedRealms(db, res, prevState) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const deletedRealms = new Set();
            const rejectedRealms = new Set();
            const previousRealmSet = prevState ? prevState.realms : [];
            const previousInviteRealmSet = prevState ? prevState.inviteRealms : [];
            const updatedRealmSet = new Set(res.realms);
            const updatedTotalRealmSet = new Set(res.realms.concat(res.inviteRealms));
            for (const realmId of previousRealmSet) {
                if (!updatedRealmSet.has(realmId)) {
                    rejectedRealms.add(realmId);
                    if (!updatedTotalRealmSet.has(realmId)) {
                        deletedRealms.add(realmId);
                    }
                }
            }
            for (const realmId of previousInviteRealmSet.concat(previousRealmSet)) {
                if (!updatedTotalRealmSet.has(realmId)) {
                    deletedRealms.add(realmId);
                }
            }
            if (deletedRealms.size > 0 || rejectedRealms.size > 0) {
                const tables = getSyncableTables(db);
                for (const table of tables) {
                    let realmsToDelete = ['realms', 'members', 'roles'].includes(table.name)
                        ? deletedRealms // These tables should spare rejected ones.
                        : rejectedRealms; // All other tables shoudl delete rejected+deleted ones
                    if (realmsToDelete.size === 0)
                        continue;
                    if (table.schema.indexes.some((idx) => idx.keyPath === 'realmId' ||
                        (Array.isArray(idx.keyPath) && idx.keyPath[0] === 'realmId'))) {
                        // There's an index to use:
                        //console.debug(`REMOVAL: deleting all ${table.name} where realmId anyOf `, JSON.stringify([...realmsToDelete]));
                        yield table
                            .where('realmId')
                            .anyOf([...realmsToDelete])
                            .delete();
                    }
                    else {
                        // No index to use:
                        //console.debug(`REMOVAL: deleting all ${table.name} where realmId is any of `, JSON.stringify([...realmsToDelete]), realmsToDelete.size);
                        yield table
                            .filter((obj) => !!(obj === null || obj === void 0 ? void 0 : obj.realmId) && realmsToDelete.has(obj.realmId))
                            .delete();
                    }
                }
            }
        });
    }
    function filterServerChangesThroughAddedClientChanges(serverChanges, addedClientChanges) {
        const changes = {};
        applyOperations(changes, serverChanges);
        const localPostChanges = {};
        applyOperations(localPostChanges, addedClientChanges);
        subtractChanges(changes, localPostChanges);
        return toDBOperationSet(changes);
    }

    function MessagesFromServerConsumer(db) {
        const queue = [];
        const readyToServe = new rxjs.BehaviorSubject(true);
        const event = new rxjs.BehaviorSubject(null);
        let isWorking = false;
        let loopWarning = 0;
        let loopDetection = [0, 0, 0, 0, 0, 0, 0, 0, 0, Date.now()];
        event.subscribe(() => __awaiter$1(this, void 0, void 0, function* () {
            if (isWorking)
                return;
            if (queue.length > 0) {
                isWorking = true;
                loopDetection.shift();
                loopDetection.push(Date.now());
                readyToServe.next(false);
                try {
                    yield consumeQueue();
                }
                finally {
                    if (loopDetection[loopDetection.length - 1] - loopDetection[0] <
                        10000) {
                        // Ten loops within 10 seconds. Slow down!
                        if (Date.now() - loopWarning < 5000) {
                            // Last time we did this, we ended up here too. Wait for a minute.
                            console.warn(`Slowing down websocket loop for one minute`);
                            loopWarning = Date.now() + 60000;
                            yield new Promise((resolve) => setTimeout(resolve, 60000));
                        }
                        else {
                            // This is a one-time event. Just pause 10 seconds.
                            console.warn(`Slowing down websocket loop for 10 seconds`);
                            loopWarning = Date.now() + 10000;
                            yield new Promise((resolve) => setTimeout(resolve, 10000));
                        }
                    }
                    isWorking = false;
                    readyToServe.next(true);
                }
            }
        }));
        function enqueue(msg) {
            queue.push(msg);
            event.next(null);
        }
        function consumeQueue() {
            var _a, _b, _c;
            return __awaiter$1(this, void 0, void 0, function* () {
                while (queue.length > 0) {
                    const msg = queue.shift();
                    try {
                        // If the sync worker or service worker is syncing, wait 'til thei're done.
                        // It's no need to have two channels at the same time - even though it wouldnt
                        // be a problem - this is an optimization.
                        yield db.cloud.syncState
                            .pipe(filter(({ phase }) => phase === 'in-sync' || phase === 'error'), take(1))
                            .toPromise();
                        console.debug('processing msg', msg);
                        const persistedSyncState = db.cloud.persistedSyncState.value;
                        //syncState.
                        if (!msg)
                            continue;
                        switch (msg.type) {
                            case 'token-expired':
                                console.debug('WebSocket observable: Token expired. Refreshing token...');
                                const user = db.cloud.currentUser.value;
                                // Refresh access token
                                const refreshedLogin = yield refreshAccessToken(db.cloud.options.databaseUrl, user);
                                // Persist updated access token
                                yield db.table('$logins').update(user.userId, {
                                    accessToken: refreshedLogin.accessToken,
                                    accessTokenExpiration: refreshedLogin.accessTokenExpiration,
                                });
                                // Updating $logins will trigger emission of db.cloud.currentUser observable, which
                                // in turn will lead to that connectWebSocket.ts will reconnect the socket with the
                                // new token. So we don't need to do anything more here.
                                break;
                            case 'realm-added':
                                //if (!persistedSyncState?.realms?.includes(msg.realm) && !persistedSyncState?.inviteRealms?.includes(msg.realm)) {
                                triggerSync(db, 'pull');
                                //}
                                break;
                            case 'realm-accepted':
                                //if (!persistedSyncState?.realms?.includes(msg.realm)) {
                                triggerSync(db, 'pull');
                                //}
                                break;
                            case 'realm-removed':
                                //if (
                                ((_a = persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.realms) === null || _a === void 0 ? void 0 : _a.includes(msg.realm)) ||
                                    ((_b = persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.inviteRealms) === null || _b === void 0 ? void 0 : _b.includes(msg.realm));
                                //) {
                                triggerSync(db, 'pull');
                                //}
                                break;
                            case 'realms-changed':
                                triggerSync(db, 'pull');
                                break;
                            case 'changes':
                                console.debug('changes');
                                if (((_c = db.cloud.syncState.value) === null || _c === void 0 ? void 0 : _c.phase) === 'error') {
                                    triggerSync(db, 'pull');
                                    break;
                                }
                                yield db.transaction('rw', db.dx.tables, (tx) => __awaiter$1(this, void 0, void 0, function* () {
                                    // @ts-ignore
                                    tx.idbtrans.disableChangeTracking = true;
                                    // @ts-ignore
                                    tx.idbtrans.disableAccessControl = true;
                                    const [schema, syncState, currentUser] = yield Promise.all([
                                        db.getSchema(),
                                        db.getPersistedSyncState(),
                                        db.getCurrentUser(),
                                    ]);
                                    console.debug('ws message queue: in transaction');
                                    if (!syncState || !schema || !currentUser) {
                                        console.debug('required vars not present', {
                                            syncState,
                                            schema,
                                            currentUser,
                                        });
                                        return; // Initial sync must have taken place - otherwise, ignore this.
                                    }
                                    // Verify again in ACID tx that we're on same server revision.
                                    if (msg.baseRev !== syncState.serverRevision) {
                                        console.debug(`baseRev (${msg.baseRev}) differs from our serverRevision in syncState (${syncState.serverRevision})`);
                                        // Should we trigger a sync now? No. This is a normal case
                                        // when another local peer (such as the SW or a websocket channel on other tab) has
                                        // updated syncState from new server information but we are not aware yet. It would
                                        // be unnescessary to do a sync in that case. Instead, the caller of this consumeQueue()
                                        // function will do readyToServe.next(true) right after this return, which will lead
                                        // to a "ready" message being sent to server with the new accurate serverRev we have,
                                        // so that the next message indeed will be correct.
                                        if (typeof msg.baseRev === 'string' && // v2 format
                                            (typeof syncState.serverRevision === 'bigint' || // v1 format
                                                typeof syncState.serverRevision === 'object') // v1 format old browser
                                        ) {
                                            // The reason for the diff seems to be that server has migrated the revision format.
                                            // Do a full sync to update revision format.
                                            // If we don't do a sync request now, we could stuck in an endless loop.
                                            triggerSync(db, 'pull');
                                        }
                                        return; // Ignore message
                                    }
                                    // Verify also that the message is based on the exact same set of realms
                                    const ourRealmSetHash = yield Dexie__default["default"].waitFor(
                                    // Keep TX in non-IDB work
                                    computeRealmSetHash(syncState));
                                    console.debug('ourRealmSetHash', ourRealmSetHash);
                                    if (ourRealmSetHash !== msg.realmSetHash) {
                                        console.debug('not same realmSetHash', msg.realmSetHash);
                                        triggerSync(db, 'pull');
                                        // The message isn't based on the same realms.
                                        // Trigger a sync instead to resolve all things up.
                                        return;
                                    }
                                    // Get clientChanges
                                    let clientChanges = [];
                                    if (currentUser.isLoggedIn) {
                                        const mutationTables = getSyncableTables(db).map((tbl) => db.table(getMutationTable(tbl.name)));
                                        clientChanges = yield listClientChanges(mutationTables, db);
                                        console.debug('msg queue: client changes', clientChanges);
                                    }
                                    if (msg.changes.length > 0) {
                                        const filteredChanges = filterServerChangesThroughAddedClientChanges(msg.changes, clientChanges);
                                        //
                                        // apply server changes
                                        //
                                        console.debug('applying filtered server changes', filteredChanges);
                                        yield applyServerChanges(filteredChanges, db);
                                    }
                                    // Update latest revisions per table in case there are unsynced changes
                                    // This can be a real case in future when we allow non-eagery sync.
                                    // And it can actually be realistic now also, but very rare.
                                    syncState.latestRevisions = getLatestRevisionsPerTable(clientChanges, syncState.latestRevisions);
                                    syncState.serverRevision = msg.newRev;
                                    // Update base revs
                                    console.debug('Updating baseRefs', syncState.latestRevisions);
                                    yield updateBaseRevs(db, schema, syncState.latestRevisions, msg.newRev);
                                    //
                                    // Update syncState
                                    //
                                    console.debug('Updating syncState', syncState);
                                    yield db.$syncState.put(syncState, 'syncState');
                                }));
                                console.debug('msg queue: done with rw transaction');
                                break;
                        }
                    }
                    catch (error) {
                        console.error(`Error in msg queue`, error);
                    }
                }
            });
        }
        return {
            enqueue,
            readyToServe,
        };
    }

    const wm$1 = new WeakMap();
    const DEXIE_CLOUD_SCHEMA = {
        members: '@id, [userId+realmId], [email+realmId], realmId',
        roles: '[realmId+name]',
        realms: '@realmId',
        $jobs: '',
        $syncState: '',
        $baseRevs: '[tableName+clientRev]',
        $logins: 'claims.sub, lastLogin',
    };
    let static_counter = 0;
    function DexieCloudDB(dx) {
        if ('vip' in dx)
            dx = dx['vip']; // Avoid race condition. Always map to a vipped dexie that don't block during db.on.ready().
        let db = wm$1.get(dx.cloud);
        if (!db) {
            const localSyncEvent = new rxjs.Subject();
            let syncStateChangedEvent = new BroadcastedAndLocalEvent(`syncstatechanged-${dx.name}`);
            localSyncEvent['id'] = ++static_counter;
            let initiallySynced = false;
            db = {
                get name() {
                    return dx.name;
                },
                close() {
                    return dx.close();
                },
                transaction: dx.transaction.bind(dx),
                table: dx.table.bind(dx),
                get tables() {
                    return dx.tables;
                },
                cloud: dx.cloud,
                get $jobs() {
                    return dx.table('$jobs');
                },
                get $syncState() {
                    return dx.table('$syncState');
                },
                get $baseRevs() {
                    return dx.table('$baseRevs');
                },
                get $logins() {
                    return dx.table('$logins');
                },
                get realms() {
                    return dx.realms;
                },
                get members() {
                    return dx.members;
                },
                get roles() {
                    return dx.roles;
                },
                get initiallySynced() {
                    return initiallySynced;
                },
                localSyncEvent,
                get syncStateChangedEvent() {
                    return syncStateChangedEvent;
                },
                dx,
            };
            const helperMethods = {
                getCurrentUser() {
                    return db.$logins
                        .toArray()
                        .then((logins) => logins.find((l) => l.isLoggedIn) || UNAUTHORIZED_USER);
                },
                getPersistedSyncState() {
                    return db.$syncState.get('syncState');
                },
                getSchema() {
                    return db.$syncState.get('schema');
                },
                getOptions() {
                    return db.$syncState.get('options');
                },
                setInitiallySynced(value) {
                    initiallySynced = value;
                },
                reconfigure() {
                    syncStateChangedEvent = new BroadcastedAndLocalEvent(`syncstatechanged-${dx.name}`);
                },
            };
            Object.assign(db, helperMethods);
            db.messageConsumer = MessagesFromServerConsumer(db);
            wm$1.set(dx.cloud, db);
        }
        return db;
    }

    // Emulate true-private property db. Why? So it's not stored in DB.
    const wm = new WeakMap();
    class AuthPersistedContext {
        constructor(db, userLogin) {
            wm.set(this, db);
            Object.assign(this, userLogin);
        }
        static load(db, userId) {
            return db
                .table("$logins")
                .get(userId)
                .then((userLogin) => new AuthPersistedContext(db, userLogin || {
                userId,
                claims: {
                    sub: userId
                },
                lastLogin: new Date(0)
            }));
        }
        save() {
            return __awaiter$1(this, void 0, void 0, function* () {
                const db = wm.get(this);
                db.table("$logins").put(this);
            });
        }
    }

    function otpFetchTokenCallback(db) {
        const { userInteraction } = db.cloud;
        return function otpAuthenticate({ public_key, hints }) {
            var _a;
            return __awaiter$1(this, void 0, void 0, function* () {
                let tokenRequest;
                const url = (_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl;
                if (!url)
                    throw new Error(`No database URL given.`);
                if ((hints === null || hints === void 0 ? void 0 : hints.grant_type) === 'demo') {
                    const demo_user = yield promptForEmail(userInteraction, 'Enter a demo user email', (hints === null || hints === void 0 ? void 0 : hints.email) || (hints === null || hints === void 0 ? void 0 : hints.userId));
                    tokenRequest = {
                        demo_user,
                        grant_type: 'demo',
                        scopes: ['ACCESS_DB'],
                        public_key,
                    };
                }
                else {
                    const email = yield promptForEmail(userInteraction, 'Enter email address', hints === null || hints === void 0 ? void 0 : hints.email);
                    tokenRequest = {
                        email,
                        grant_type: 'otp',
                        scopes: ['ACCESS_DB'],
                        public_key,
                    };
                }
                const res1 = yield fetch(`${url}/token`, {
                    body: JSON.stringify(tokenRequest),
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', mode: 'cors' },
                });
                if (res1.status !== 200) {
                    const errMsg = yield res1.text();
                    yield alertUser(userInteraction, "Token request failed", {
                        type: 'error',
                        messageCode: 'GENERIC_ERROR',
                        message: errMsg,
                        messageParams: {}
                    }).catch(() => { });
                    throw new HttpError(res1, errMsg);
                }
                const response = yield res1.json();
                if (response.type === 'tokens') {
                    // Demo user request can get a "tokens" response right away
                    return response;
                }
                else if (tokenRequest.grant_type === 'otp') {
                    if (response.type !== 'otp-sent')
                        throw new Error(`Unexpected response from ${url}/token`);
                    const otp = yield promptForOTP(userInteraction, tokenRequest.email);
                    tokenRequest.otp = otp || '';
                    tokenRequest.otp_id = response.otp_id;
                    let res2 = yield fetch(`${url}/token`, {
                        body: JSON.stringify(tokenRequest),
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        mode: 'cors',
                    });
                    while (res2.status === 401) {
                        const errorText = yield res2.text();
                        tokenRequest.otp = yield promptForOTP(userInteraction, tokenRequest.email, {
                            type: 'error',
                            messageCode: 'INVALID_OTP',
                            message: errorText,
                            messageParams: {}
                        });
                        res2 = yield fetch(`${url}/token`, {
                            body: JSON.stringify(tokenRequest),
                            method: 'post',
                            headers: { 'Content-Type': 'application/json' },
                            mode: 'cors',
                        });
                    }
                    if (res2.status !== 200) {
                        const errMsg = yield res2.text();
                        yield alertUser(userInteraction, "OTP Authentication Failed", {
                            type: 'error',
                            messageCode: 'GENERIC_ERROR',
                            message: errMsg,
                            messageParams: {}
                        }).catch(() => { });
                        throw new HttpError(res2, errMsg);
                    }
                    const response2 = yield res2.json();
                    return response2;
                }
                else {
                    throw new Error(`Unexpected response from ${url}/token`);
                }
            });
        };
    }

    /** This function changes or sets the current user as requested.
     *
     * Use cases:
     * * Initially on db.ready after reading the current user from db.$logins.
     *   This will make sure that any unsynced operations from the previous user is synced before
     *   changing the user.
     * * Upon user request
     *
     * @param db
     * @param newUser
     */
    function setCurrentUser(db, user) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (user.userId === db.cloud.currentUserId)
                return; // Already this user.
            const $logins = db.table('$logins');
            yield db.transaction('rw', $logins, (tx) => __awaiter$1(this, void 0, void 0, function* () {
                const existingLogins = yield $logins.toArray();
                yield Promise.all(existingLogins
                    .filter((login) => login.userId !== user.userId && login.isLoggedIn)
                    .map((login) => {
                    login.isLoggedIn = false;
                    return $logins.put(login);
                }));
                user.isLoggedIn = true;
                user.lastLogin = new Date();
                yield user.save();
                console.debug('Saved new user', user.email);
            }));
            yield new Promise((resolve) => {
                if (db.cloud.currentUserId === user.userId) {
                    resolve(null);
                }
                else {
                    const subscription = db.cloud.currentUser.subscribe((currentUser) => {
                        if (currentUser.userId === user.userId) {
                            subscription.unsubscribe();
                            resolve(null);
                        }
                    });
                }
            });
            // TANKAR!!!!
            // V: Service workern kommer inte ha tillgång till currentUserObservable om den inte istället härrör från ett liveQuery.
            // V: Samma med andra windows.
            // V: Så kanske göra om den till att häröra från liveQuery som läser $logins.orderBy('lastLogin').last().
            // V: Då bara vara medveten om:
            //    V: En sån observable börjar hämta data vid första subscribe
            //    V: Vi har inget "inital value" men kan emulera det till att vara ANONYMOUS_USER
            //    V: Om requireAuth är true, så borde db.on(ready) hålla databasen stängd för alla utom denna observable.
            //    V: Om inte så behöver den inte blocka.
            // Andra tankar:
            //    * Man kan inte byta användare när man är offline. Skulle gå att flytta realms till undanstuff-tabell vid user-change.
            //      men troligen inte värt det.
            //    * Istället: sälj inte inte switch-user funktionalitet utan tala enbart om inloggat vs icke inloggat läge.
            //    * populate $logins med ANONYMOUS så att en påbörjad inloggning inte räknas, alternativt ha en boolean prop!
            //      Kanske bäst ha en boolean prop!
            //    * Alternativ switch-user funktionalitet:
            //      * DBCore gömmer data från realms man inte har tillgång till.
            //      * Cursor impl behövs också då.
            //      * Då blir det snabba user switch.
            //      * claims-settet som skickas till servern blir summan av alla claims. Då måste servern stödja multipla tokens eller
            //        att ens token är ett samlad.
        });
    }

    function login(db, hints) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const currentUser = yield db.getCurrentUser();
            if (currentUser.isLoggedIn) {
                if (hints) {
                    if (hints.email && db.cloud.currentUser.value.email !== hints.email) {
                        throw new Error(`Must logout before changing user`);
                    }
                    if (hints.userId && db.cloud.currentUserId !== hints.userId) {
                        throw new Error(`Must logout before changing user`);
                    }
                }
                // Already authenticated according to given hints.
                return;
            }
            const context = new AuthPersistedContext(db, {
                claims: {},
                lastLogin: new Date(0),
            });
            yield authenticate(db.cloud.options.databaseUrl, context, db.cloud.options.fetchTokens || otpFetchTokenCallback(db), db.cloud.userInteraction, hints);
            yield context.save();
            yield setCurrentUser(db, context);
            // Make sure to resync as the new login will be authorized
            // for new realms.
            triggerSync(db, "pull");
        });
    }

    // @ts-ignore
    const isFirefox = typeof InstallTrigger !== 'undefined';

    const isSafari = typeof navigator !== 'undefined' &&
        /Safari\//.test(navigator.userAgent) &&
        !/Chrom(e|ium)\/|Edge\//.test(navigator.userAgent);
    const safariVersion = isSafari
        ? // @ts-ignore
            [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1]
        : NaN;

    // What we know: Safari 14.1 (version 605) crashes when using dexie-cloud's service worker.
    // We don't know what exact call is causing this. Have tried safari-14-idb-fix with no luck.
    // Something we do in the service worker is triggering the crash.
    // When next Safari version (606) is out we will start enabling SW again, hoping that the bug is solved.
    // If not, we might increment 605 to 606.
    const DISABLE_SERVICEWORKER_STRATEGY = (isSafari && safariVersion <= 605) || // Disable for Safari for now.
        isFirefox; // Disable for Firefox for now. Seems to have a bug in reading CryptoKeys from IDB from service workers

    /* Helper function to subscribe to database close no matter if it was unexpectedly closed or manually using db.close()
     */
    function dbOnClosed(db, handler) {
        db.on.close.subscribe(handler);
        const origClose = db.close;
        db.close = function () {
            origClose.call(this);
            handler();
        };
        return () => {
            db.on.close.unsubscribe(handler);
            db.close = origClose;
        };
    }

    const IS_SERVICE_WORKER = typeof self !== "undefined" && "clients" in self && !self.document;

    function throwVersionIncrementNeeded() {
        throw new Dexie__default["default"].SchemaError(`Version increment needed to allow dexie-cloud change tracking`);
    }

    const { toString } = {};
    function toStringTag(o) {
        return toString.call(o).slice(8, -1);
    }
    function getEffectiveKeys(primaryKey, req) {
        var _a;
        if (req.type === 'delete')
            return req.keys;
        return ((_a = req.keys) === null || _a === void 0 ? void 0 : _a.slice()) || req.values.map(primaryKey.extractKey);
    }
    function applyToUpperBitFix(orig, bits) {
        return ((bits & 1 ? orig[0].toUpperCase() : orig[0].toLowerCase()) +
            (bits & 2 ? orig[1].toUpperCase() : orig[1].toLowerCase()) +
            (bits & 4 ? orig[2].toUpperCase() : orig[2].toLowerCase()));
    }
    const consonants = /b|c|d|f|g|h|j|k|l|m|n|p|q|r|s|t|v|x|y|z/i;
    function isUpperCase(ch) {
        return ch >= 'A' && ch <= 'Z';
    }
    function generateTablePrefix(tableName, allPrefixes) {
        let rv = tableName[0].toLocaleLowerCase(); // "users" = "usr", "friends" = "frn", "realms" = "rlm", etc.
        for (let i = 1, l = tableName.length; i < l && rv.length < 3; ++i) {
            if (consonants.test(tableName[i]) || isUpperCase(tableName[i]))
                rv += tableName[i].toLowerCase();
        }
        while (allPrefixes.has(rv)) {
            if (/\d/g.test(rv)) {
                rv = rv.substr(0, rv.length - 1) + (rv[rv.length - 1] + 1);
                if (rv.length > 3)
                    rv = rv.substr(0, 3);
                else
                    continue;
            }
            else if (rv.length < 3) {
                rv = rv + '2';
                continue;
            }
            let bitFix = 1;
            let upperFixed = rv;
            while (allPrefixes.has(upperFixed) && bitFix < 8) {
                upperFixed = applyToUpperBitFix(rv, bitFix);
                ++bitFix;
            }
            if (bitFix < 8)
                rv = upperFixed;
            else {
                let nextChar = (rv.charCodeAt(2) + 1) & 127;
                rv = rv.substr(0, 2) + String.fromCharCode(nextChar);
                // Here, in theory we could get an infinite loop if having 127*8 table names with identical 3 first consonants.
            }
        }
        return rv;
    }
    let time = 0;
    /**
     *
     * @param prefix A unique 3-letter short-name of the table.
     * @param shardKey 3 last letters from another ID if colocation is requested. Verified on server on inserts - guarantees unique IDs across shards.
     *  The shardKey part of the key represent the shardId where it was first created. An object with this
     *  primary key can later on be moved to another shard without being altered. The reason for having
     *  the origin shardKey as part of the key, is that the server will not need to check uniqueness constraint
     *  across all shards on every insert. Updates / moves across shards are already controlled by the server
     *  in the sense that the objects needs to be there already - we only need this part for inserts.
     * @returns
     */
    function generateKey(prefix, shardKey) {
        const a = new Uint8Array(18);
        const timePart = new Uint8Array(a.buffer, 0, 6);
        const now = Date.now(); // Will fit into 6 bytes until year 10 895.
        if (time >= now) {
            // User is bulk-creating objects the same millisecond.
            // Increment the time part by one millisecond for each item.
            // If bulk-creating 1,000,000 rows client-side in 10 seconds,
            // the last time-stamp will be 990 seconds in future, which is no biggie at all.
            // The point is to create a nice order of the generated IDs instead of
            // using random ids.
            ++time;
        }
        else {
            time = now;
        }
        timePart[0] = time / 1099511627776; // Normal division (no bitwise operator) --> works with >= 32 bits.
        timePart[1] = time / 4294967296;
        timePart[2] = time / 16777216;
        timePart[3] = time / 65536;
        timePart[4] = time / 256;
        timePart[5] = time;
        const randomPart = new Uint8Array(a.buffer, 6);
        crypto.getRandomValues(randomPart);
        const id = new Uint8Array(a.buffer);
        return prefix + b64LexEncode(id) + (shardKey || '');
    }

    function createIdGenerationMiddleware(db) {
        return {
            stack: 'dbcore',
            name: 'idGenerationMiddleware',
            level: 1,
            create: (core) => {
                return Object.assign(Object.assign({}, core), { table: (tableName) => {
                        const table = core.table(tableName);
                        function generateOrVerifyAtKeys(req, idPrefix) {
                            let valueClones = null;
                            const keys = getEffectiveKeys(table.schema.primaryKey, req);
                            keys.forEach((key, idx) => {
                                if (key === undefined) {
                                    // Generate the key
                                    const colocatedId = req.values[idx].realmId || db.cloud.currentUserId;
                                    const shardKey = colocatedId.substr(colocatedId.length - 3);
                                    keys[idx] = generateKey(idPrefix, shardKey);
                                    if (!table.schema.primaryKey.outbound) {
                                        if (!valueClones)
                                            valueClones = req.values.slice();
                                        valueClones[idx] = Dexie__default["default"].deepClone(valueClones[idx]);
                                        Dexie__default["default"].setByKeyPath(valueClones[idx], table.schema.primaryKey.keyPath, keys[idx]);
                                    }
                                }
                                else if (typeof key !== 'string' ||
                                    (!key.startsWith(idPrefix) && !key.startsWith('#' + idPrefix))) {
                                    // Key was specified by caller. Verify it complies with id prefix.
                                    throw new Dexie__default["default"].ConstraintError(`The ID "${key}" is not valid for table "${tableName}". ` +
                                        `Primary '@' keys requires the key to be prefixed with "${idPrefix}" (or "#${idPrefix}).\n` +
                                        `If you want to generate IDs programmatically, remove '@' from the schema to get rid of this constraint. Dexie Cloud supports custom IDs as long as they are random and globally unique.`);
                                }
                            });
                            return table.mutate(Object.assign(Object.assign({}, req), { keys, values: valueClones || req.values }));
                        }
                        return Object.assign(Object.assign({}, table), { mutate: (req) => {
                                var _a, _b;
                                // @ts-ignore
                                if (req.trans.disableChangeTracking) {
                                    // Disable ID policy checks and ID generation
                                    return table.mutate(req);
                                }
                                if (req.type === 'add' || req.type === 'put') {
                                    const cloudTableSchema = (_a = db.cloud.schema) === null || _a === void 0 ? void 0 : _a[tableName];
                                    if (!(cloudTableSchema === null || cloudTableSchema === void 0 ? void 0 : cloudTableSchema.generatedGlobalId)) {
                                        if (cloudTableSchema === null || cloudTableSchema === void 0 ? void 0 : cloudTableSchema.markedForSync) {
                                            // Just make sure primary key is of a supported type:
                                            const keys = getEffectiveKeys(table.schema.primaryKey, req);
                                            keys.forEach((key, idx) => {
                                                if (!isValidSyncableID(key)) {
                                                    const type = Array.isArray(key)
                                                        ? key.map(toStringTag).join(',')
                                                        : toStringTag(key);
                                                    throw new Dexie__default["default"].ConstraintError(`Invalid primary key type ${type} for table ${tableName}. Tables marked for sync has primary keys of type string or Array of string (and optional numbers)`);
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        if (((_b = db.cloud.options) === null || _b === void 0 ? void 0 : _b.databaseUrl) && !db.initiallySynced) {
                                            // A database URL is configured but no initial sync has been performed.
                                            const keys = getEffectiveKeys(table.schema.primaryKey, req);
                                            // Check if the operation would yield any INSERT. If so, complain! We never want wrong ID prefixes stored.
                                            return table
                                                .getMany({ keys, trans: req.trans, cache: 'immutable' })
                                                .then((results) => {
                                                if (results.length < keys.length) {
                                                    // At least one of the given objects would be created. Complain since
                                                    // the generated ID would be based on a locally computed ID prefix only - we wouldn't
                                                    // know if the server would give the same ID prefix until an initial sync has been
                                                    // performed.
                                                    throw new Error(`Unable to create new objects without an initial sync having been performed.`);
                                                }
                                                return table.mutate(req);
                                            });
                                        }
                                        return generateOrVerifyAtKeys(req, cloudTableSchema.idPrefix);
                                    }
                                }
                                return table.mutate(req);
                            } });
                    } });
            },
        };
    }

    function createImplicitPropSetterMiddleware(db) {
        return {
            stack: 'dbcore',
            name: 'implicitPropSetterMiddleware',
            level: 1,
            create: (core) => {
                return Object.assign(Object.assign({}, core), { table: (tableName) => {
                        const table = core.table(tableName);
                        return Object.assign(Object.assign({}, table), { mutate: (req) => {
                                var _a, _b, _c, _d;
                                // @ts-ignore
                                if (req.trans.disableChangeTracking) {
                                    return table.mutate(req);
                                }
                                const trans = req.trans;
                                if ((_b = (_a = db.cloud.schema) === null || _a === void 0 ? void 0 : _a[tableName]) === null || _b === void 0 ? void 0 : _b.markedForSync) {
                                    if (req.type === 'add' || req.type === 'put') {
                                        // No matter if user is logged in or not, make sure "owner" and "realmId" props are set properly.
                                        // If not logged in, this will be changed upon syncification of the tables (next sync after login),
                                        // however, application code will work better if we can always rely on that the properties realmId
                                        // and owner are set. Application code may index them and query them based on db.cloud.currentUserId,
                                        // and expect them to be returned. That scenario must work also when db.cloud.currentUserId === 'unauthorized'.
                                        for (const obj of req.values) {
                                            if (!obj.owner) {
                                                obj.owner = trans.currentUser.userId;
                                            }
                                            if (!obj.realmId) {
                                                obj.realmId = trans.currentUser.userId;
                                            }
                                            const key = (_d = (_c = table.schema.primaryKey).extractKey) === null || _d === void 0 ? void 0 : _d.call(_c, obj);
                                            if (typeof key === 'string' && key[0] === '#') {
                                                // Add $ts prop for put operations and
                                                // disable update operations as well as consistent
                                                // modify operations. Reason: Server may not have
                                                // the object. Object should be created on server only
                                                // if is being updated. An update operation won't create it
                                                // so we must delete req.changeSpec to decrate operation to
                                                // an upsert operation with timestamp so that it will be created.
                                                // We must also degrade from consistent modify operations for the
                                                // same reason - object might be there on server. Must but put up instead.
                                                // FUTURE: This clumpsy behavior of private IDs could be refined later.
                                                // Suggestion is to in future, treat private IDs as we treat all objects 
                                                // and sync operations normally. Only that deletions should become soft deletes
                                                // for them - so that server knows when a private ID has been deleted on server
                                                // not accept insert/upserts on them.
                                                if (req.type === 'put') {
                                                    delete req.criteria;
                                                    delete req.changeSpec;
                                                    delete req.changeSpecs;
                                                    obj.$ts = Date.now();
                                                }
                                            }
                                        }
                                    }
                                }
                                return table.mutate(req);
                            } });
                    } });
            },
        };
    }

    function allSettled(possiblePromises) {
        return new Promise(resolve => {
            if (possiblePromises.length === 0)
                resolve([]);
            let remaining = possiblePromises.length;
            const results = new Array(remaining);
            possiblePromises.forEach((p, i) => Promise.resolve(p).then(value => results[i] = { status: "fulfilled", value }, reason => results[i] = { status: "rejected", reason })
                .then(() => --remaining || resolve(results)));
        });
    }

    let counter$1 = 0;
    function guardedTable(table) {
        const prop = "$lock" + (++counter$1);
        return Object.assign(Object.assign({}, table), { count: readLock(table.count, prop), get: readLock(table.get, prop), getMany: readLock(table.getMany, prop), openCursor: readLock(table.openCursor, prop), query: readLock(table.query, prop), mutate: writeLock(table.mutate, prop) });
    }
    function readLock(fn, prop) {
        return function readLocker(req) {
            const { readers, writers, } = req.trans[prop] || (req.trans[prop] = { writers: [], readers: [] });
            const numWriters = writers.length;
            const promise = (numWriters > 0
                ? writers[numWriters - 1].then(() => fn(req), () => fn(req))
                : fn(req)).finally(() => readers.splice(readers.indexOf(promise)));
            readers.push(promise);
            return promise;
        };
    }
    function writeLock(fn, prop) {
        return function writeLocker(req) {
            const { readers, writers, } = req.trans[prop] || (req.trans[prop] = { writers: [], readers: [] });
            let promise = (writers.length > 0
                ? writers[writers.length - 1].then(() => fn(req), () => fn(req))
                : readers.length > 0
                    ? allSettled(readers).then(() => fn(req))
                    : fn(req)).finally(() => writers.shift());
            writers.push(promise);
            return promise;
        };
    }

    const outstandingTransactions = new rxjs.BehaviorSubject(new Set());

    /** Tracks all mutations in the same transaction as the mutations -
     * so it is guaranteed that no mutation goes untracked - and if transaction
     * aborts, the mutations won't be tracked.
     *
     * The sync job will use the tracked mutations as the source of truth when pushing
     * changes to server and cleanup the tracked mutations once the server has
     * ackowledged that it got them.
     */
    function createMutationTrackingMiddleware({ currentUserObservable, db }) {
        return {
            stack: 'dbcore',
            name: 'MutationTrackingMiddleware',
            level: 1,
            create: (core) => {
                const ordinaryTables = core.schema.tables.filter((t) => !/^\$/.test(t.name));
                let mutTableMap;
                try {
                    mutTableMap = new Map(ordinaryTables.map((tbl) => [
                        tbl.name,
                        core.table(`$${tbl.name}_mutations`)
                    ]));
                }
                catch (_a) {
                    throwVersionIncrementNeeded();
                }
                return Object.assign(Object.assign({}, core), { transaction: (tables, mode) => {
                        let tx;
                        if (mode === 'readwrite') {
                            const mutationTables = tables
                                .filter((tbl) => { var _a, _b; return (_b = (_a = db.cloud.schema) === null || _a === void 0 ? void 0 : _a[tbl]) === null || _b === void 0 ? void 0 : _b.markedForSync; })
                                .map((tbl) => getMutationTable(tbl));
                            tx = core.transaction([...tables, ...mutationTables], mode);
                        }
                        else {
                            tx = core.transaction(tables, mode);
                        }
                        if (mode === 'readwrite') {
                            // Give each transaction a globally unique id.
                            tx.txid = randomString$1(16);
                            // Introduce the concept of current user that lasts through the entire transaction.
                            // This is important because the tracked mutations must be connected to the user.
                            tx.currentUser = currentUserObservable.value;
                            outstandingTransactions.value.add(tx);
                            outstandingTransactions.next(outstandingTransactions.value);
                            const removeTransaction = () => {
                                tx.removeEventListener('complete', txComplete);
                                tx.removeEventListener('error', removeTransaction);
                                tx.removeEventListener('abort', removeTransaction);
                                outstandingTransactions.value.delete(tx);
                                outstandingTransactions.next(outstandingTransactions.value);
                            };
                            const txComplete = () => {
                                var _a;
                                if (tx.mutationsAdded && ((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl)) {
                                    if (db.cloud.usingServiceWorker) {
                                        console.debug('registering sync event');
                                        registerSyncEvent(db, "push");
                                    }
                                    else {
                                        db.localSyncEvent.next({ purpose: "push" });
                                    }
                                }
                                removeTransaction();
                            };
                            tx.addEventListener('complete', txComplete);
                            tx.addEventListener('error', removeTransaction);
                            tx.addEventListener('abort', removeTransaction);
                        }
                        return tx;
                    }, table: (tableName) => {
                        const table = core.table(tableName);
                        if (/^\$/.test(tableName)) {
                            if (tableName.endsWith('_mutations')) {
                                // In case application code adds items to ..._mutations tables,
                                // make sure to set the mutationsAdded flag on transaction.
                                // This is also done in mutateAndLog() as that function talks to a
                                // lower level DBCore and wouldn't be catched by this code.
                                return Object.assign(Object.assign({}, table), { mutate: (req) => {
                                        if (req.type === 'add' || req.type === 'put') {
                                            req.trans.mutationsAdded = true;
                                        }
                                        return table.mutate(req);
                                    } });
                            }
                            else if (tableName === '$logins') {
                                return Object.assign(Object.assign({}, table), { mutate: (req) => {
                                        //console.debug('Mutating $logins table', req);
                                        return table
                                            .mutate(req)
                                            .then((res) => {
                                            //console.debug('Mutating $logins');
                                            req.trans.mutationsAdded = true;
                                            //console.debug('$logins mutated');
                                            return res;
                                        })
                                            .catch((err) => {
                                            console.debug('Failed mutation $logins', err);
                                            return Promise.reject(err);
                                        });
                                    } });
                            }
                            else {
                                return table;
                            }
                        }
                        const { schema } = table;
                        const mutsTable = mutTableMap.get(tableName);
                        return guardedTable(Object.assign(Object.assign({}, table), { mutate: (req) => {
                                var _a, _b, _c;
                                const trans = req.trans;
                                if (!trans.txid)
                                    return table.mutate(req); // Upgrade transactions not guarded by us.
                                if (trans.disableChangeTracking)
                                    return table.mutate(req);
                                if (!((_b = (_a = db.cloud.schema) === null || _a === void 0 ? void 0 : _a[tableName]) === null || _b === void 0 ? void 0 : _b.markedForSync))
                                    return table.mutate(req);
                                if (!((_c = trans.currentUser) === null || _c === void 0 ? void 0 : _c.isLoggedIn)) {
                                    // Unauthorized user should not log mutations.
                                    // Instead, after login all local data should be logged at once.
                                    return table.mutate(req);
                                }
                                return req.type === 'deleteRange'
                                    ? table
                                        // Query the actual keys (needed for server sending correct rollback to us)
                                        .query({
                                        query: { range: req.range, index: schema.primaryKey },
                                        trans: req.trans,
                                        values: false
                                    })
                                        // Do a delete request instead, but keep the criteria info for the server to execute
                                        .then((res) => {
                                        return mutateAndLog({
                                            type: 'delete',
                                            keys: res.result,
                                            trans: req.trans,
                                            criteria: { index: null, range: req.range }
                                        });
                                    })
                                    : mutateAndLog(req);
                            } }));
                        function mutateAndLog(req) {
                            const trans = req.trans;
                            trans.mutationsAdded = true;
                            const { txid, currentUser: { userId } } = trans;
                            const { type } = req;
                            return table.mutate(req).then((res) => {
                                const { numFailures: hasFailures, failures } = res;
                                let keys = type === 'delete' ? req.keys : res.results;
                                let values = 'values' in req ? req.values : [];
                                let changeSpecs = 'changeSpecs' in req ? req.changeSpecs : [];
                                if (hasFailures) {
                                    keys = keys.filter((_, idx) => !failures[idx]);
                                    values = values.filter((_, idx) => !failures[idx]);
                                    changeSpecs = changeSpecs.filter((_, idx) => !failures[idx]);
                                }
                                const ts = Date.now();
                                const mut = req.type === 'delete'
                                    ? {
                                        type: 'delete',
                                        ts,
                                        keys,
                                        criteria: req.criteria,
                                        txid,
                                        userId
                                    }
                                    : req.type === 'add'
                                        ? {
                                            type: 'insert',
                                            ts,
                                            keys,
                                            txid,
                                            userId,
                                            values
                                        }
                                        : req.criteria && req.changeSpec
                                            ? {
                                                // Common changeSpec for all keys
                                                type: 'modify',
                                                ts,
                                                keys,
                                                criteria: req.criteria,
                                                changeSpec: req.changeSpec,
                                                txid,
                                                userId
                                            }
                                            : req.changeSpecs
                                                ? {
                                                    // One changeSpec per key
                                                    type: 'update',
                                                    ts,
                                                    keys,
                                                    changeSpecs,
                                                    txid,
                                                    userId
                                                }
                                                : {
                                                    type: 'upsert',
                                                    ts,
                                                    keys,
                                                    values,
                                                    txid,
                                                    userId
                                                };
                                return keys.length > 0 || ('criteria' in req && req.criteria)
                                    ? mutsTable
                                        .mutate({ type: 'add', trans, values: [mut] }) // Log entry
                                        .then(() => res) // Return original response
                                    : res;
                            });
                        }
                    } });
            }
        };
    }

    function overrideParseStoresSpec(origFunc, dexie) {
        return function (stores, dbSchema) {
            const storesClone = Object.assign(Object.assign({}, DEXIE_CLOUD_SCHEMA), stores);
            const cloudSchema = dexie.cloud.schema || (dexie.cloud.schema = {});
            const allPrefixes = new Set();
            Object.keys(storesClone).forEach(tableName => {
                const schemaSrc = storesClone[tableName];
                const cloudTableSchema = cloudSchema[tableName] || (cloudSchema[tableName] = {});
                if (schemaSrc != null) {
                    if (/^\@/.test(schemaSrc)) {
                        storesClone[tableName] = storesClone[tableName].substr(1);
                        cloudTableSchema.generatedGlobalId = true;
                        cloudTableSchema.idPrefix = generateTablePrefix(tableName, allPrefixes);
                        allPrefixes.add(cloudTableSchema.idPrefix);
                    }
                    if (!/^\$/.test(tableName)) {
                        storesClone[`$${tableName}_mutations`] = '++rev';
                        cloudTableSchema.markedForSync = true;
                    }
                    if (cloudTableSchema.deleted) {
                        cloudTableSchema.deleted = false;
                    }
                }
                else {
                    cloudTableSchema.deleted = true;
                    cloudTableSchema.markedForSync = false;
                    storesClone[`$${tableName}_mutations`] = null;
                }
            });
            const rv = origFunc.call(this, storesClone, dbSchema);
            return rv;
        };
    }

    function performInitialSync(db, cloudOptions, cloudSchema) {
        return __awaiter$1(this, void 0, void 0, function* () {
            console.debug('Performing initial sync');
            yield sync(db, cloudOptions, cloudSchema, { isInitialSync: true });
            console.debug('Done initial sync');
        });
    }

    const USER_INACTIVITY_TIMEOUT = 180000; // 3 minutes
    const INACTIVE_WAIT_TIME = 20000;
    // This observable will be emitted to later down....
    const userIsActive = new rxjs.BehaviorSubject(true);
    // A refined version that waits before changing state:
    // * Wait another INACTIVE_WAIT_TIME before accepting that the user is inactive.
    //   Reason 1: Spare resources - no need to setup the entire websocket flow when
    //             switching tabs back and forth.
    //   Reason 2: Less flickering for the end user when switching tabs back and forth.
    // * Wait another ACTIVE_WAIT_TIME before accepting that the user is active.
    //   Possible reason to have a value here: Sparing resources if users often temporary click the tab
    //   for just a short time.
    const userIsReallyActive = new rxjs.BehaviorSubject(true);
    userIsActive
        .pipe(switchMap((isActive) => {
        //console.debug('SyncStatus: DUBB: isActive changed to', isActive);
        return isActive
            ? rxjs.of(true)
            : rxjs.of(false).pipe(delay(INACTIVE_WAIT_TIME))
                ;
    }), distinctUntilChanged())
        .subscribe(userIsReallyActive);
    //
    // First create some corner-stone observables to build the flow on
    //
    // document.onvisibilitychange:
    const visibilityStateIsChanged = typeof document !== 'undefined'
        ? rxjs.fromEvent(document, 'visibilitychange')
        : rxjs.of({});
    // document.onvisibilitychange makes document hidden:
    const documentBecomesHidden = visibilityStateIsChanged.pipe(filter(() => document.visibilityState === 'hidden'));
    // document.onvisibilitychange makes document visible
    const documentBecomesVisible = visibilityStateIsChanged.pipe(filter(() => document.visibilityState === 'visible'));
    // Any of various user-activity-related events happen:
    const userDoesSomething = typeof window !== 'undefined'
        ? rxjs.merge(documentBecomesVisible, rxjs.fromEvent(window, 'mousedown'), rxjs.fromEvent(window, 'mousemove'), rxjs.fromEvent(window, 'keydown'), rxjs.fromEvent(window, 'wheel'), rxjs.fromEvent(window, 'touchmove'))
        : rxjs.of({});
    if (typeof document !== 'undefined') {
        //
        // Now, create a final observable and start subscribing to it in order
        // to make it emit values to userIsActive BehaviourSubject (which is the
        // most important global hot observable we have here)
        //
        // Live test: https://jsitor.com/LboCDHgbn
        //
        rxjs.merge(rxjs.of(true), // Make sure something is always emitted from start
        documentBecomesHidden, // so that we can eagerly emit false!
        userDoesSomething)
            .pipe(
        // No matter event source, compute whether user is visible using visibilityState:
        map(() => document.visibilityState === 'visible'), 
        // Make sure to emit it
        tap((isActive) => {
            if (userIsActive.value !== isActive) {
                // Emit new value unless it already has that value
                userIsActive.next(isActive);
            }
        }), 
        // Now, if true was emitted, make sure to set a timeout to emit false
        // unless new user activity things happen (in that case, the timeout will be cancelled!)
        switchMap((isActive) => isActive
            ? rxjs.of(0).pipe(delay(USER_INACTIVITY_TIMEOUT - INACTIVE_WAIT_TIME), tap(() => userIsActive.next(false)))
            : rxjs.of(0)))
            .subscribe(() => { }); // Unless we subscribe nothing will be propagated to userIsActive observable
    }

    class TokenExpiredError extends Error {
        constructor() {
            super(...arguments);
            this.name = "TokenExpiredError";
        }
    }

    const SERVER_PING_TIMEOUT = 20000;
    const CLIENT_PING_INTERVAL = 30000;
    const FAIL_RETRY_WAIT_TIME = 60000;
    class WSObservable extends rxjs.Observable {
        constructor(databaseUrl, rev, realmSetHash, clientIdentity, messageProducer, webSocketStatus, token, tokenExpiration) {
            super((subscriber) => new WSConnection(databaseUrl, rev, realmSetHash, clientIdentity, token, tokenExpiration, subscriber, messageProducer, webSocketStatus));
        }
    }
    let counter = 0;
    class WSConnection extends rxjs.Subscription {
        constructor(databaseUrl, rev, realmSetHash, clientIdentity, token, tokenExpiration, subscriber, messageProducer, webSocketStatus) {
            super(() => this.teardown());
            this.id = ++counter;
            this.reconnecting = false;
            console.debug('New WebSocket Connection', this.id, token ? 'authorized' : 'unauthorized');
            this.databaseUrl = databaseUrl;
            this.rev = rev;
            this.realmSetHash = realmSetHash;
            this.clientIdentity = clientIdentity;
            this.token = token;
            this.tokenExpiration = tokenExpiration;
            this.subscriber = subscriber;
            this.lastUserActivity = new Date();
            this.messageProducer = messageProducer;
            this.messageProducerSubscription = null;
            this.webSocketStatus = webSocketStatus;
            this.connect();
        }
        teardown() {
            console.debug('Teardown WebSocket Connection', this.id);
            this.disconnect();
        }
        disconnect() {
            this.webSocketStatus.next('disconnected');
            if (this.pinger) {
                clearInterval(this.pinger);
                this.pinger = null;
            }
            if (this.ws) {
                try {
                    this.ws.close();
                }
                catch (_a) { }
            }
            this.ws = null;
            if (this.messageProducerSubscription) {
                this.messageProducerSubscription.unsubscribe();
                this.messageProducerSubscription = null;
            }
        }
        reconnect() {
            if (this.reconnecting)
                return;
            this.reconnecting = true;
            try {
                this.disconnect();
            }
            catch (_a) { }
            this.connect()
                .catch(() => { })
                .then(() => (this.reconnecting = false)); // finally()
        }
        connect() {
            return __awaiter$1(this, void 0, void 0, function* () {
                this.lastServerActivity = new Date();
                if (this.pauseUntil && this.pauseUntil > new Date()) {
                    console.debug('WS not reconnecting just yet', {
                        id: this.id,
                        pauseUntil: this.pauseUntil,
                    });
                    return;
                }
                if (this.ws) {
                    throw new Error(`Called connect() when a connection is already open`);
                }
                if (!this.databaseUrl)
                    throw new Error(`Cannot connect without a database URL`);
                if (this.closed) {
                    //console.debug('SyncStatus: DUBB: Ooops it was closed!');
                    return;
                }
                if (this.tokenExpiration && this.tokenExpiration < new Date()) {
                    this.subscriber.error(new TokenExpiredError()); // Will be handled in connectWebSocket.ts.
                    return;
                }
                this.webSocketStatus.next('connecting');
                this.pinger = setInterval(() => __awaiter$1(this, void 0, void 0, function* () {
                    if (this.closed) {
                        console.debug('pinger check', this.id, 'CLOSED.');
                        this.teardown();
                        return;
                    }
                    if (this.ws) {
                        try {
                            this.ws.send(JSON.stringify({ type: 'ping' }));
                            setTimeout(() => {
                                console.debug('pinger setTimeout', this.id, this.pinger ? `alive` : 'dead');
                                if (!this.pinger)
                                    return;
                                if (this.closed) {
                                    console.debug('pinger setTimeout', this.id, 'subscription is closed');
                                    this.teardown();
                                    return;
                                }
                                if (this.lastServerActivity <
                                    new Date(Date.now() - SERVER_PING_TIMEOUT)) {
                                    // Server inactive. Reconnect if user is active.
                                    console.debug('pinger: server is inactive');
                                    console.debug('pinger reconnecting');
                                    this.reconnect();
                                }
                                else {
                                    console.debug('pinger: server still active');
                                }
                            }, SERVER_PING_TIMEOUT);
                        }
                        catch (_a) {
                            console.debug('pinger catch error', this.id, 'reconnecting');
                            this.reconnect();
                        }
                    }
                    else {
                        console.debug('pinger', this.id, 'reconnecting');
                        this.reconnect();
                    }
                }), CLIENT_PING_INTERVAL);
                // The following vars are needed because we must know which callback to ack when server sends it's ack to us.
                const wsUrl = new URL(this.databaseUrl);
                wsUrl.protocol = wsUrl.protocol === 'http:' ? 'ws' : 'wss';
                const searchParams = new URLSearchParams();
                if (this.subscriber.closed)
                    return;
                searchParams.set('v', '2');
                searchParams.set('rev', this.rev);
                searchParams.set('realmsHash', this.realmSetHash);
                searchParams.set('clientId', this.clientIdentity);
                if (this.token) {
                    searchParams.set('token', this.token);
                }
                // Connect the WebSocket to given url:
                console.debug('dexie-cloud WebSocket create');
                const ws = (this.ws = new WebSocket(`${wsUrl}/changes?${searchParams}`));
                //ws.binaryType = "arraybuffer"; // For future when subscribing to actual changes.
                ws.onclose = (event) => {
                    if (!this.pinger)
                        return;
                    console.debug('dexie-cloud WebSocket onclosed', this.id);
                    this.reconnect();
                };
                ws.onmessage = (event) => {
                    if (!this.pinger)
                        return;
                    console.debug('dexie-cloud WebSocket onmessage', event.data);
                    this.lastServerActivity = new Date();
                    try {
                        const msg = TSON.parse(event.data);
                        if (msg.type === 'error') {
                            throw new Error(`Error message from dexie-cloud: ${msg.error}`);
                        }
                        if (msg.type === 'rev') {
                            this.rev = msg.rev; // No meaning but seems reasonable.
                        }
                        if (msg.type !== 'pong') {
                            this.subscriber.next(msg);
                        }
                    }
                    catch (e) {
                        this.subscriber.error(e);
                    }
                };
                try {
                    let everConnected = false;
                    yield new Promise((resolve, reject) => {
                        ws.onopen = (event) => {
                            console.debug('dexie-cloud WebSocket onopen');
                            everConnected = true;
                            resolve(null);
                        };
                        ws.onerror = (event) => {
                            if (!everConnected) {
                                const error = event.error || new Error('WebSocket Error');
                                this.subscriber.error(error);
                                this.webSocketStatus.next('error');
                                reject(error);
                            }
                            else {
                                this.reconnect();
                            }
                        };
                    });
                    this.messageProducerSubscription = this.messageProducer.subscribe((msg) => {
                        var _a;
                        if (!this.closed) {
                            if (msg.type === 'ready' &&
                                this.webSocketStatus.value !== 'connected') {
                                this.webSocketStatus.next('connected');
                            }
                            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(TSON.stringify(msg));
                        }
                    });
                }
                catch (error) {
                    this.pauseUntil = new Date(Date.now() + FAIL_RETRY_WAIT_TIME);
                }
            });
        }
    }

    function sleep$1(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function waitAndReconnectWhenUserDoesSomething(error) {
        return __awaiter$1(this, void 0, void 0, function* () {
            console.error(`WebSocket observable: error but revive when user does some active thing...`, error);
            // Sleep some seconds...
            yield sleep$1(3000);
            // Wait til user does something (move mouse, tap, scroll, click etc)
            console.debug('waiting for someone to do something');
            yield userDoesSomething.pipe(take(1)).toPromise();
            console.debug('someone did something!');
        });
    }
    function connectWebSocket(db) {
        var _a;
        if (!((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl)) {
            throw new Error(`No database URL to connect WebSocket to`);
        }
        const messageProducer = db.messageConsumer.readyToServe.pipe(filter((isReady) => isReady), // When consumer is ready for new messages, produce such a message to inform server about it
        switchMap(() => db.getPersistedSyncState()), // We need the info on which server revision we are at:
        filter((syncState) => syncState && syncState.serverRevision), // We wont send anything to server before inital sync has taken place
        map((syncState) => ({
            // Produce the message to trigger server to send us new messages to consume:
            type: 'ready',
            rev: syncState.serverRevision,
        })));
        function createObservable() {
            return db.cloud.persistedSyncState.pipe(filter((syncState) => syncState === null || syncState === void 0 ? void 0 : syncState.serverRevision), // Don't connect before there's no initial sync performed.
            take(1), // Don't continue waking up whenever syncState change
            switchMap((syncState) => db.cloud.currentUser.pipe(map((userLogin) => [userLogin, syncState]))), switchMap(([userLogin, syncState]) => userIsReallyActive.pipe(map((isActive) => [isActive ? userLogin : null, syncState]))), switchMap(([userLogin, syncState]) => __awaiter$1(this, void 0, void 0, function* () { return [userLogin, yield computeRealmSetHash(syncState)]; })), switchMap(([userLogin, realmSetHash]) => 
            // Let server end query changes from last entry of same client-ID and forward.
            // If no new entries, server won't bother the client. If new entries, server sends only those
            // and the baseRev of the last from same client-ID.
            userLogin
                ? new WSObservable(db.cloud.options.databaseUrl, db.cloud.persistedSyncState.value.serverRevision, realmSetHash, db.cloud.persistedSyncState.value.clientIdentity, messageProducer, db.cloud.webSocketStatus, userLogin.accessToken, userLogin.accessTokenExpiration)
                : rxjs.from([])), catchError((error) => {
                if ((error === null || error === void 0 ? void 0 : error.name) === 'TokenExpiredError') {
                    console.debug('WebSocket observable: Token expired. Refreshing token...');
                    return rxjs.of(true).pipe(switchMap(() => __awaiter$1(this, void 0, void 0, function* () {
                        // Refresh access token
                        const user = yield db.getCurrentUser();
                        const refreshedLogin = yield refreshAccessToken(db.cloud.options.databaseUrl, user);
                        // Persist updated access token
                        yield db.table('$logins').update(user.userId, {
                            accessToken: refreshedLogin.accessToken,
                            accessTokenExpiration: refreshedLogin.accessTokenExpiration,
                        });
                    })), switchMap(() => createObservable()));
                }
                else {
                    return rxjs.throwError(error);
                }
            }), catchError((error) => {
                db.cloud.webSocketStatus.next("error");
                return rxjs.from(waitAndReconnectWhenUserDoesSomething(error)).pipe(switchMap(() => createObservable()));
            }));
        }
        return createObservable().subscribe((msg) => {
            if (msg) {
                console.debug('WS got message', msg);
                db.messageConsumer.enqueue(msg);
            }
        }, (error) => {
            console.error('Oops! The main observable errored!', error);
        }, () => {
            console.error('Oops! The main observable completed!');
        });
    }

    function isSyncNeeded(db) {
        var _a;
        return __awaiter$1(this, void 0, void 0, function* () {
            return ((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl) && db.cloud.schema
                ? yield sync(db, db.cloud.options, db.cloud.schema, { justCheckIfNeeded: true })
                : false;
        });
    }

    const SECONDS = 1000;
    const MINUTES = 60 * SECONDS;

    const myId = randomString$1(16);

    const GUARDED_JOB_HEARTBEAT = 1 * SECONDS;
    const GUARDED_JOB_TIMEOUT = 1 * MINUTES;
    function performGuardedJob(db, jobName, jobsTableName, job, { awaitRemoteJob } = {}) {
        return __awaiter$1(this, void 0, void 0, function* () {
            // Start working.
            //
            // Check if someone else is working on this already.
            //
            const jobsTable = db.table(jobsTableName);
            function aquireLock() {
                return __awaiter$1(this, void 0, void 0, function* () {
                    const gotTheLock = yield db.transaction('rw!', jobsTableName, () => __awaiter$1(this, void 0, void 0, function* () {
                        const currentWork = yield jobsTable.get(jobName);
                        if (!currentWork) {
                            // No one else is working. Let's record that we are.
                            yield jobsTable.add({
                                nodeId: myId,
                                started: new Date(),
                                heartbeat: new Date()
                            }, jobName);
                            return true;
                        }
                        else if (currentWork.heartbeat.getTime() <
                            Date.now() - GUARDED_JOB_TIMEOUT) {
                            console.warn(`Latest ${jobName} worker seem to have died.\n`, `The dead job started:`, currentWork.started, `\n`, `Last heart beat was:`, currentWork.heartbeat, '\n', `We're now taking over!`);
                            // Now, take over!
                            yield jobsTable.put({
                                nodeId: myId,
                                started: new Date(),
                                heartbeat: new Date()
                            }, jobName);
                            return true;
                        }
                        return false;
                    }));
                    if (gotTheLock)
                        return true;
                    // Someone else took the job.
                    if (awaitRemoteJob) {
                        try {
                            const jobDoneObservable = rxjs.from(Dexie.liveQuery(() => jobsTable.get(jobName))).pipe(timeout(GUARDED_JOB_TIMEOUT), filter((job) => !job)); // Wait til job is not there anymore.
                            yield jobDoneObservable.toPromise();
                            return false;
                        }
                        catch (err) {
                            if (err.name !== 'TimeoutError') {
                                throw err;
                            }
                            // Timeout stopped us! Try aquire the lock now.
                            // It will likely succeed this time unless
                            // another client took it.
                            return yield aquireLock();
                        }
                    }
                    return false;
                });
            }
            if (yield aquireLock()) {
                // We own the lock entry and can do our job undisturbed.
                // We're not within a transaction, but these type of locks
                // spans over transactions.
                // Start our heart beat during the job.
                // Use setInterval to make sure we are updating heartbeat even during long-lived fetch calls.
                const heartbeat = setInterval(() => {
                    jobsTable.update(jobName, (job) => {
                        if (job.nodeId === myId) {
                            job.heartbeat = new Date();
                        }
                    });
                }, GUARDED_JOB_HEARTBEAT);
                try {
                    return yield job();
                }
                finally {
                    // Stop heartbeat
                    clearInterval(heartbeat);
                    // Remove the persisted job state:
                    yield db.transaction('rw!', jobsTableName, () => __awaiter$1(this, void 0, void 0, function* () {
                        const currentWork = yield jobsTable.get(jobName);
                        if (currentWork && currentWork.nodeId === myId) {
                            yield jobsTable.delete(jobName);
                        }
                    }));
                }
            }
        });
    }

    const ongoingSyncs = new WeakMap();
    function syncIfPossible(db, cloudOptions, cloudSchema, options) {
        const ongoing = ongoingSyncs.get(db);
        if (ongoing) {
            if (ongoing.pull || (options === null || options === void 0 ? void 0 : options.purpose) === 'push') {
                console.debug('syncIfPossible(): returning the ongoing sync promise.');
                return ongoing.promise;
            }
            else {
                // Ongoing sync may never do anything in case there are no outstanding changes
                // to sync (because its purpose was "push" not "pull")
                // Now, however, we are asked to do a sync with the purpose of "pull"
                // We want to optimize here. We must wait for the ongoing to complete
                // and then, if the ongoing sync never resulted in a sync request,
                // we must redo the sync.
                // To inspect what is happening in the ongoing request, let's subscribe
                // to db.cloud.syncState and look for if it is doing any "pulling" phase:
                let hasPullTakenPlace = false;
                const subscription = db.cloud.syncState.subscribe((syncState) => {
                    if (syncState.phase === 'pulling') {
                        hasPullTakenPlace = true;
                    }
                });
                // Ok, so now we are watching. At the same time, wait for the ongoing to complete
                // and when it has completed, check if we're all set or if we need to redo
                // the call:
                return (ongoing.promise
                    // This is a finally block but we are still running tests on
                    // browsers that don't support it, so need to do it like this:
                    .then(() => {
                    subscription.unsubscribe();
                })
                    .catch((error) => {
                    subscription.unsubscribe();
                    return Promise.reject(error);
                })
                    .then(() => {
                    if (!hasPullTakenPlace) {
                        // No pull took place in the ongoing sync but the caller had "pull" as
                        // an explicit purpose of this call - so we need to redo the call!
                        return syncIfPossible(db, cloudOptions, cloudSchema, options);
                    }
                }));
            }
        }
        const promise = _syncIfPossible();
        ongoingSyncs.set(db, { promise, pull: (options === null || options === void 0 ? void 0 : options.purpose) !== 'push' });
        return promise;
        function _syncIfPossible() {
            return __awaiter$1(this, void 0, void 0, function* () {
                try {
                    if (db.cloud.usingServiceWorker) {
                        if (IS_SERVICE_WORKER) {
                            yield sync(db, cloudOptions, cloudSchema, options);
                        }
                    }
                    else {
                        // We use a flow that is better suited for the case when multiple workers want to
                        // do the same thing.
                        yield performGuardedJob(db, CURRENT_SYNC_WORKER, '$jobs', () => sync(db, cloudOptions, cloudSchema, options));
                    }
                    ongoingSyncs.delete(db);
                    console.debug('Done sync');
                }
                catch (error) {
                    ongoingSyncs.delete(db);
                    console.error(`Failed to sync client changes`, error);
                    throw error; // Make sure we rethrow error so that sync event is retried.
                    // I don't think we should setTimout or so here.
                    // Unless server tells us to in some response.
                    // Then we could follow that advice but not by waiting here but by registering
                    // Something that triggers an event listened to in startPushWorker()
                }
            });
        }
    }

    function LocalSyncWorker(db, cloudOptions, cloudSchema) {
        let localSyncEventSubscription = null;
        //let syncHandler: ((event: Event) => void) | null = null;
        //let periodicSyncHandler: ((event: Event) => void) | null = null;
        let cancelToken = { cancelled: false };
        function syncAndRetry(purpose, retryNum = 1) {
            // Use setTimeout() to get onto a clean stack and
            // break free from possible active transaction:
            setTimeout(() => {
                syncIfPossible(db, cloudOptions, cloudSchema, {
                    cancelToken,
                    retryImmediatelyOnFetchError: true,
                    purpose,
                }).catch((e) => {
                    console.error('error in syncIfPossible()', e);
                    if (cancelToken.cancelled) {
                        stop();
                    }
                    else if (retryNum < 3) {
                        // Mimic service worker sync event: retry 3 times
                        // * first retry after 5 minutes
                        // * second retry 15 minutes later
                        setTimeout(() => syncAndRetry(purpose, retryNum + 1), [0, 5, 15][retryNum] * MINUTES);
                    }
                });
            }, 0);
        }
        const start = () => {
            // Sync eagerly whenever a change has happened (+ initially when there's no syncState yet)
            // This initial subscribe will also trigger an sync also now.
            console.debug('Starting LocalSyncWorker', db.localSyncEvent['id']);
            localSyncEventSubscription = db.localSyncEvent.subscribe(({ purpose }) => {
                try {
                    syncAndRetry(purpose || 'pull');
                }
                catch (err) {
                    console.error('What-the....', err);
                }
            });
            //setTimeout(()=>db.localSyncEvent.next({}), 5000);
        };
        const stop = () => {
            console.debug('Stopping LocalSyncWorker');
            cancelToken.cancelled = true;
            if (localSyncEventSubscription)
                localSyncEventSubscription.unsubscribe();
        };
        return {
            start,
            stop,
        };
    }

    function updateSchemaFromOptions(schema, options) {
        if (schema && options) {
            if (options.unsyncedTables) {
                for (const tableName of options.unsyncedTables) {
                    if (schema[tableName]) {
                        schema[tableName].markedForSync = false;
                    }
                }
            }
        }
    }

    function verifySchema(db) {
        var _a, _b;
        for (const table of db.tables) {
            if ((_b = (_a = db.cloud.schema) === null || _a === void 0 ? void 0 : _a[table.name]) === null || _b === void 0 ? void 0 : _b.markedForSync) {
                if (table.schema.primKey.auto) {
                    throw new Dexie__default["default"].SchemaError(`Table ${table.name} is both autoIncremented and synced. ` +
                        `Use db.cloud.configure({unsyncedTables: [${JSON.stringify(table.name)}]}) to blacklist it from sync`);
                }
                if (!table.schema.primKey.keyPath) {
                    throw new Dexie__default["default"].SchemaError(`Table ${table.name} cannot be both synced and outbound. ` +
                        `Use db.cloud.configure({unsyncedTables: [${JSON.stringify(table.name)}]}) to blacklist it from sync`);
                }
            }
        }
    }

    var n,u$1,i$1,t$1,r$1={},f$1=[],e$1=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function c$1(n,l){for(var u in l)n[u]=l[u];return n}function s$1(n){var l=n.parentNode;l&&l.removeChild(n);}function a$1(n,l,u){var i,t,o,r=arguments,f={};for(o in l)"key"==o?i=l[o]:"ref"==o?t=l[o]:f[o]=l[o];if(arguments.length>3)for(u=[u],o=3;o<arguments.length;o++)u.push(r[o]);if(null!=u&&(f.children=u),"function"==typeof n&&null!=n.defaultProps)for(o in n.defaultProps)void 0===f[o]&&(f[o]=n.defaultProps[o]);return v$1(n,f,i,t,null)}function v$1(l,u,i,t,o){var r={type:l,props:u,key:i,ref:t,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:null==o?++n.__v:o};return null!=n.vnode&&n.vnode(r),r}function y(n){return n.children}function p$1(n,l){this.props=n,this.context=l;}function d$1(n,l){if(null==l)return n.__?d$1(n.__,n.__.__k.indexOf(n)+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return "function"==typeof n.type?d$1(n):null}function _(n){var l,u;if(null!=(n=n.__)&&null!=n.__c){for(n.__e=n.__c.base=null,l=0;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e){n.__e=n.__c.base=u.__e;break}return _(n)}}function k$1(l){(!l.__d&&(l.__d=!0)&&u$1.push(l)&&!b$1.__r++||t$1!==n.debounceRendering)&&((t$1=n.debounceRendering)||i$1)(b$1);}function b$1(){for(var n;b$1.__r=u$1.length;)n=u$1.sort(function(n,l){return n.__v.__b-l.__v.__b}),u$1=[],n.some(function(n){var l,u,i,t,o,r;n.__d&&(o=(t=(l=n).__v).__e,(r=l.__P)&&(u=[],(i=c$1({},t)).__v=t.__v+1,I(r,t,i,l.__n,void 0!==r.ownerSVGElement,null!=t.__h?[o]:null,u,null==o?d$1(t):o,t.__h),T(u,t),t.__e!=o&&_(t)));});}function m$1(n,l,u,i,t,o,e,c,s,a){var h,p,_,k,b,m,w,A=i&&i.__k||f$1,P=A.length;for(u.__k=[],h=0;h<l.length;h++)if(null!=(k=u.__k[h]=null==(k=l[h])||"boolean"==typeof k?null:"string"==typeof k||"number"==typeof k||"bigint"==typeof k?v$1(null,k,null,null,k):Array.isArray(k)?v$1(y,{children:k},null,null,null):k.__b>0?v$1(k.type,k.props,k.key,null,k.__v):k)){if(k.__=u,k.__b=u.__b+1,null===(_=A[h])||_&&k.key==_.key&&k.type===_.type)A[h]=void 0;else for(p=0;p<P;p++){if((_=A[p])&&k.key==_.key&&k.type===_.type){A[p]=void 0;break}_=null;}I(n,k,_=_||r$1,t,o,e,c,s,a),b=k.__e,(p=k.ref)&&_.ref!=p&&(w||(w=[]),_.ref&&w.push(_.ref,null,k),w.push(p,k.__c||b,k)),null!=b?(null==m&&(m=b),"function"==typeof k.type&&null!=k.__k&&k.__k===_.__k?k.__d=s=g$1(k,s,n):s=x$1(n,k,_,A,b,s),a||"option"!==u.type?"function"==typeof u.type&&(u.__d=s):n.value=""):s&&_.__e==s&&s.parentNode!=n&&(s=d$1(_));}for(u.__e=m,h=P;h--;)null!=A[h]&&("function"==typeof u.type&&null!=A[h].__e&&A[h].__e==u.__d&&(u.__d=d$1(i,h+1)),L(A[h],A[h]));if(w)for(h=0;h<w.length;h++)z(w[h],w[++h],w[++h]);}function g$1(n,l,u){var i,t;for(i=0;i<n.__k.length;i++)(t=n.__k[i])&&(t.__=n,l="function"==typeof t.type?g$1(t,l,u):x$1(u,t,t,n.__k,t.__e,l));return l}function x$1(n,l,u,i,t,o){var r,f,e;if(void 0!==l.__d)r=l.__d,l.__d=void 0;else if(null==u||t!=o||null==t.parentNode)n:if(null==o||o.parentNode!==n)n.appendChild(t),r=null;else {for(f=o,e=0;(f=f.nextSibling)&&e<i.length;e+=2)if(f==t)break n;n.insertBefore(t,o),r=o;}return void 0!==r?r:t.nextSibling}function A(n,l,u,i,t){var o;for(o in u)"children"===o||"key"===o||o in l||C(n,o,null,u[o],i);for(o in l)t&&"function"!=typeof l[o]||"children"===o||"key"===o||"value"===o||"checked"===o||u[o]===l[o]||C(n,o,l[o],u[o],i);}function P(n,l,u){"-"===l[0]?n.setProperty(l,u):n[l]=null==u?"":"number"!=typeof u||e$1.test(l)?u:u+"px";}function C(n,l,u,i,t){var o;n:if("style"===l)if("string"==typeof u)n.style.cssText=u;else {if("string"==typeof i&&(n.style.cssText=i=""),i)for(l in i)u&&l in u||P(n.style,l,"");if(u)for(l in u)i&&u[l]===i[l]||P(n.style,l,u[l]);}else if("o"===l[0]&&"n"===l[1])o=l!==(l=l.replace(/Capture$/,"")),l=l.toLowerCase()in n?l.toLowerCase().slice(2):l.slice(2),n.l||(n.l={}),n.l[l+o]=u,u?i||n.addEventListener(l,o?H:$,o):n.removeEventListener(l,o?H:$,o);else if("dangerouslySetInnerHTML"!==l){if(t)l=l.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if("href"!==l&&"list"!==l&&"form"!==l&&"tabIndex"!==l&&"download"!==l&&l in n)try{n[l]=null==u?"":u;break n}catch(n){}"function"==typeof u||(null!=u&&(!1!==u||"a"===l[0]&&"r"===l[1])?n.setAttribute(l,u):n.removeAttribute(l));}}function $(l){this.l[l.type+!1](n.event?n.event(l):l);}function H(l){this.l[l.type+!0](n.event?n.event(l):l);}function I(l,u,i,t,o,r,f,e,s){var a,v,h,d,_,k,b,g,w,x,A,P=u.type;if(void 0!==u.constructor)return null;null!=i.__h&&(s=i.__h,e=u.__e=i.__e,u.__h=null,r=[e]),(a=n.__b)&&a(u);try{n:if("function"==typeof P){if(g=u.props,w=(a=P.contextType)&&t[a.__c],x=a?w?w.props.value:a.__:t,i.__c?b=(v=u.__c=i.__c).__=v.__E:("prototype"in P&&P.prototype.render?u.__c=v=new P(g,x):(u.__c=v=new p$1(g,x),v.constructor=P,v.render=M),w&&w.sub(v),v.props=g,v.state||(v.state={}),v.context=x,v.__n=t,h=v.__d=!0,v.__h=[]),null==v.__s&&(v.__s=v.state),null!=P.getDerivedStateFromProps&&(v.__s==v.state&&(v.__s=c$1({},v.__s)),c$1(v.__s,P.getDerivedStateFromProps(g,v.__s))),d=v.props,_=v.state,h)null==P.getDerivedStateFromProps&&null!=v.componentWillMount&&v.componentWillMount(),null!=v.componentDidMount&&v.__h.push(v.componentDidMount);else {if(null==P.getDerivedStateFromProps&&g!==d&&null!=v.componentWillReceiveProps&&v.componentWillReceiveProps(g,x),!v.__e&&null!=v.shouldComponentUpdate&&!1===v.shouldComponentUpdate(g,v.__s,x)||u.__v===i.__v){v.props=g,v.state=v.__s,u.__v!==i.__v&&(v.__d=!1),v.__v=u,u.__e=i.__e,u.__k=i.__k,u.__k.forEach(function(n){n&&(n.__=u);}),v.__h.length&&f.push(v);break n}null!=v.componentWillUpdate&&v.componentWillUpdate(g,v.__s,x),null!=v.componentDidUpdate&&v.__h.push(function(){v.componentDidUpdate(d,_,k);});}v.context=x,v.props=g,v.state=v.__s,(a=n.__r)&&a(u),v.__d=!1,v.__v=u,v.__P=l,a=v.render(v.props,v.state,v.context),v.state=v.__s,null!=v.getChildContext&&(t=c$1(c$1({},t),v.getChildContext())),h||null==v.getSnapshotBeforeUpdate||(k=v.getSnapshotBeforeUpdate(d,_)),A=null!=a&&a.type===y&&null==a.key?a.props.children:a,m$1(l,Array.isArray(A)?A:[A],u,i,t,o,r,f,e,s),v.base=u.__e,u.__h=null,v.__h.length&&f.push(v),b&&(v.__E=v.__=null),v.__e=!1;}else null==r&&u.__v===i.__v?(u.__k=i.__k,u.__e=i.__e):u.__e=j$1(i.__e,u,i,t,o,r,f,s);(a=n.diffed)&&a(u);}catch(l){u.__v=null,(s||null!=r)&&(u.__e=e,u.__h=!!s,r[r.indexOf(e)]=null),n.__e(l,u,i);}}function T(l,u){n.__c&&n.__c(u,l),l.some(function(u){try{l=u.__h,u.__h=[],l.some(function(n){n.call(u);});}catch(l){n.__e(l,u.__v);}});}function j$1(n,l,u,i,t,o,e,c){var a,v,h,y,p=u.props,d=l.props,_=l.type,k=0;if("svg"===_&&(t=!0),null!=o)for(;k<o.length;k++)if((a=o[k])&&(a===n||(_?a.localName==_:3==a.nodeType))){n=a,o[k]=null;break}if(null==n){if(null===_)return document.createTextNode(d);n=t?document.createElementNS("http://www.w3.org/2000/svg",_):document.createElement(_,d.is&&d),o=null,c=!1;}if(null===_)p===d||c&&n.data===d||(n.data=d);else {if(o=o&&f$1.slice.call(n.childNodes),v=(p=u.props||r$1).dangerouslySetInnerHTML,h=d.dangerouslySetInnerHTML,!c){if(null!=o)for(p={},y=0;y<n.attributes.length;y++)p[n.attributes[y].name]=n.attributes[y].value;(h||v)&&(h&&(v&&h.__html==v.__html||h.__html===n.innerHTML)||(n.innerHTML=h&&h.__html||""));}if(A(n,d,p,t,c),h)l.__k=[];else if(k=l.props.children,m$1(n,Array.isArray(k)?k:[k],l,u,i,t&&"foreignObject"!==_,o,e,n.firstChild,c),null!=o)for(k=o.length;k--;)null!=o[k]&&s$1(o[k]);c||("value"in d&&void 0!==(k=d.value)&&(k!==n.value||"progress"===_&&!k)&&C(n,"value",k,p.value,!1),"checked"in d&&void 0!==(k=d.checked)&&k!==n.checked&&C(n,"checked",k,p.checked,!1));}return n}function z(l,u,i){try{"function"==typeof l?l(u):l.current=u;}catch(l){n.__e(l,i);}}function L(l,u,i){var t,o,r;if(n.unmount&&n.unmount(l),(t=l.ref)&&(t.current&&t.current!==l.__e||z(t,null,u)),i||"function"==typeof l.type||(i=null!=(o=l.__e)),l.__e=l.__d=void 0,null!=(t=l.__c)){if(t.componentWillUnmount)try{t.componentWillUnmount();}catch(l){n.__e(l,u);}t.base=t.__P=null;}if(t=l.__k)for(r=0;r<t.length;r++)t[r]&&L(t[r],u,i);null!=o&&s$1(o);}function M(n,l,u){return this.constructor(n,u)}function N(l,u,i){var t,o,e;n.__&&n.__(l,u),o=(t="function"==typeof i)?null:i&&i.__k||u.__k,e=[],I(u,l=(!t&&i||u).__k=a$1(y,null,[l]),o||r$1,r$1,void 0!==u.ownerSVGElement,!t&&i?[i]:o?null:u.firstChild?f$1.slice.call(u.childNodes):null,e,!t&&i?i:o?o.__e:u.firstChild,t),T(e,l);}n={__e:function(n,l){for(var u,i,t;l=l.__;)if((u=l.__c)&&!u.__)try{if((i=u.constructor)&&null!=i.getDerivedStateFromError&&(u.setState(i.getDerivedStateFromError(n)),t=u.__d),null!=u.componentDidCatch&&(u.componentDidCatch(n),t=u.__d),t)return u.__E=u}catch(l){n=l;}throw n},__v:0},p$1.prototype.setState=function(n,l){var u;u=null!=this.__s&&this.__s!==this.state?this.__s:this.__s=c$1({},this.state),"function"==typeof n&&(n=n(c$1({},u),this.props)),n&&c$1(u,n),null!=n&&this.__v&&(l&&this.__h.push(l),k$1(this));},p$1.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),k$1(this));},p$1.prototype.render=y,u$1=[],i$1="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,b$1.__r=0;

    const Styles = {
        Error: {
            color: "red",
        },
        Alert: {
            error: {
                color: "red"
            },
            warning: {
                color: "yellow"
            },
            info: {
                color: "black"
            }
        },
        Darken: {
            position: "fixed",
            top: 0,
            left: 0,
            opacity: 0.5,
            backgroundColor: "#000",
            width: "100vw",
            height: "100vh",
            zIndex: 150,
            webkitBackdropFilter: "blur(2px)",
            backdropFilter: "blur(2px)",
        },
        DialogOuter: {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 150,
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
        },
        DialogInner: {
            position: "relative",
            color: "#222",
            backgroundColor: "#fff",
            padding: "30px",
            marginBottom: "2em",
            maxWidth: "90%",
            maxHeight: "90%",
            overflowY: "auto",
            border: "3px solid #3d3d5d",
            borderRadius: "8px",
            boxShadow: "0 0 80px 10px #666",
            width: "auto"
        },
        Input: {
            height: "35px",
            width: "17em",
            borderColor: "#ccf4",
            outline: "none",
            fontSize: "17pt",
            padding: "8px"
        }
    };

    function Dialog({ children }) {
        return (a$1("div", null,
            a$1("div", { style: Styles.Darken }),
            a$1("div", { style: Styles.DialogOuter },
                a$1("div", { style: Styles.DialogInner }, children))));
    }

    var t,u,r,o=0,i=[],c=n.__b,f=n.__r,e=n.diffed,a=n.__c,v=n.unmount;function m(t,r){n.__h&&n.__h(u,t,o||r),o=0;var i=u.__H||(u.__H={__:[],__h:[]});return t>=i.__.length&&i.__.push({}),i.__[t]}function l(n){return o=1,p(w,n)}function p(n,r,o){var i=m(t++,2);return i.t=n,i.__c||(i.__=[o?o(r):w(void 0,r),function(n){var t=i.t(i.__[0],n);i.__[0]!==t&&(i.__=[t,i.__[1]],i.__c.setState({}));}],i.__c=u),i.__}function h(r,o){var i=m(t++,4);!n.__s&&k(i.__H,o)&&(i.__=r,i.__H=o,u.__h.push(i));}function s(n){return o=5,d(function(){return {current:n}},[])}function d(n,u){var r=m(t++,7);return k(r.__H,u)&&(r.__=n(),r.__H=u,r.__h=n),r.__}function x(){i.forEach(function(t){if(t.__P)try{t.__H.__h.forEach(g),t.__H.__h.forEach(j),t.__H.__h=[];}catch(u){t.__H.__h=[],n.__e(u,t.__v);}}),i=[];}n.__b=function(n){u=null,c&&c(n);},n.__r=function(n){f&&f(n),t=0;var r=(u=n.__c).__H;r&&(r.__h.forEach(g),r.__h.forEach(j),r.__h=[]);},n.diffed=function(t){e&&e(t);var o=t.__c;o&&o.__H&&o.__H.__h.length&&(1!==i.push(o)&&r===n.requestAnimationFrame||((r=n.requestAnimationFrame)||function(n){var t,u=function(){clearTimeout(r),b&&cancelAnimationFrame(t),setTimeout(n);},r=setTimeout(u,100);b&&(t=requestAnimationFrame(u));})(x)),u=void 0;},n.__c=function(t,u){u.some(function(t){try{t.__h.forEach(g),t.__h=t.__h.filter(function(n){return !n.__||j(n)});}catch(r){u.some(function(n){n.__h&&(n.__h=[]);}),u=[],n.__e(r,t.__v);}}),a&&a(t,u);},n.unmount=function(t){v&&v(t);var u=t.__c;if(u&&u.__H)try{u.__H.__.forEach(g);}catch(t){n.__e(t,u.__v);}};var b="function"==typeof requestAnimationFrame;function g(n){var t=u;"function"==typeof n.__c&&n.__c(),u=t;}function j(n){var t=u;n.__c=n.__(),u=t;}function k(n,t){return !n||n.length!==t.length||t.some(function(t,u){return t!==n[u]})}function w(n,t){return "function"==typeof t?t(n):t}

    function resolveText({ message, messageCode, messageParams }) {
        return message.replace(/\{\w+\}/ig, n => messageParams[n.substr(1, n.length - 2)]);
    }

    function LoginDialog({ title, alerts, fields, onCancel, onSubmit, }) {
        const [params, setParams] = l({});
        const firstFieldRef = s();
        h(() => { var _a; return (_a = firstFieldRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, []);
        return (a$1(Dialog, null,
            a$1(y, null,
                a$1("h3", { style: Styles.WindowHeader }, title),
                alerts.map((alert) => (a$1("p", { style: Styles.Alert[alert.type] }, resolveText(alert)))),
                a$1("form", { onSubmit: ev => {
                        ev.preventDefault();
                        onSubmit(params);
                    } }, Object.entries(fields).map(([fieldName, { type, label, placeholder }], idx) => (a$1("label", { style: Styles.Label },
                    label ? `${label}: ` : '',
                    a$1("input", { ref: idx === 0 ? firstFieldRef : undefined, type: type, name: fieldName, autoComplete: "on", style: Styles.Input, autoFocus: true, placeholder: placeholder, value: params[fieldName] || '', onInput: (ev) => { var _a; return setParams(Object.assign(Object.assign({}, params), { [fieldName]: valueTransformer(type, (_a = ev.target) === null || _a === void 0 ? void 0 : _a['value']) })); } })))))),
            a$1("div", { style: Styles.ButtonsDiv },
                a$1("button", { type: "submit", style: Styles.Button, onClick: () => onSubmit(params) }, "Submit"),
                a$1("button", { style: Styles.Button, onClick: onCancel }, "Cancel"))));
    }
    function valueTransformer(type, value) {
        switch (type) {
            case "email": return value.toLowerCase();
            case "otp": return value.toUpperCase();
            default: return value;
        }
    }

    class LoginGui extends p$1 {
        constructor(props) {
            super(props);
            this.observer = (userInteraction) => this.setState({ userInteraction });
            this.state = { userInteraction: undefined };
        }
        componentDidMount() {
            this.subscription = rxjs.from(this.props.db.cloud.userInteraction).subscribe(this.observer);
        }
        componentWillUnmount() {
            if (this.subscription) {
                this.subscription.unsubscribe();
                delete this.subscription;
            }
        }
        render(props, { userInteraction }) {
            if (!userInteraction)
                return null;
            //if (props.db.cloud.userInteraction.observers.length > 1) return null; // Someone else subscribes.
            return a$1(LoginDialog, Object.assign({}, userInteraction));
        }
    }
    function setupDefaultGUI(db) {
        const el = document.createElement('div');
        document.body.appendChild(el);
        N(a$1(LoginGui, { db: db.vip }), el);
        let closed = false;
        return {
            unsubscribe() {
                el.remove();
                closed = true;
            },
            get closed() {
                return closed;
            }
        };
    }
    // TODO:
    /*
        * Gjort klart allt kring user interaction förutom att mounta default-ui på ett element.
        * Också att kolla först om nån annan subscribar och i så fall inte göra nåt.
    */

    function computeSyncState(db) {
        let _prevStatus = db.cloud.webSocketStatus.value;
        const lazyWebSocketStatus = db.cloud.webSocketStatus.pipe(switchMap((status) => {
            const prevStatus = _prevStatus;
            _prevStatus = status;
            const rv = rxjs.of(status);
            switch (status) {
                // A normal scenario is that the WS reconnects and falls shortly in disconnected-->connection-->connected.
                // Don't distract user with this unless these things take more time than normal:
                // Only show disconnected if disconnected more than 500ms, or if we can
                // see that the user is indeed not active.
                case 'disconnected':
                    return userIsActive.value ? rv.pipe(debounceTime(500)) : rv;
                // Only show connecting if previous state was 'not-started' or 'error', or if
                // the time it takes to connect goes beyond 4 seconds.
                case 'connecting':
                    return prevStatus === 'not-started' || prevStatus === 'error'
                        ? rv
                        : rv.pipe(debounceTime(4000));
                default:
                    return rv;
            }
        }));
        return rxjs.combineLatest([
            lazyWebSocketStatus,
            db.syncStateChangedEvent.pipe(startWith({ phase: 'initial' })),
            userIsReallyActive
        ]).pipe(map(([status, syncState, userIsActive]) => {
            let { phase, error, progress } = syncState;
            let adjustedStatus = status;
            if (phase === 'error') {
                // Let users only rely on the status property to display an icon.
                // If there's an error in the sync phase, let it show on that
                // status icon also.
                adjustedStatus = 'error';
            }
            if (status === 'not-started') {
                // If websocket isn't yet connected becase we're doing
                // the startup sync, let the icon show the symbol for connecting.
                if (phase === 'pushing' || phase === 'pulling') {
                    adjustedStatus = 'connecting';
                }
            }
            const previousPhase = db.cloud.syncState.value.phase;
            //const previousStatus = db.cloud.syncState.value.status;
            if (previousPhase === 'error' && (syncState.phase === 'pushing' || syncState.phase === 'pulling')) {
                // We were in an errored state but is now doing sync. Show "connecting" icon.
                adjustedStatus = 'connecting';
            }
            /*if (syncState.phase === 'in-sync' && adjustedStatus === 'connecting') {
              adjustedStatus = 'connected';
            }*/
            if (!userIsActive) {
                adjustedStatus = 'disconnected';
            }
            const retState = {
                phase,
                error,
                progress,
                status: isOnline ? adjustedStatus : 'offline',
            };
            return retState;
        }));
    }

    function associate(factory) {
        const wm = new WeakMap();
        return (x) => {
            let rv = wm.get(x);
            if (!rv) {
                rv = factory(x);
                wm.set(x, rv);
            }
            return rv;
        };
    }

    function createSharedValueObservable(o, defaultValue) {
        let currentValue = defaultValue;
        let shared = rxjs.from(o).pipe(rxjs.map((x) => (currentValue = x)), rxjs.share({ resetOnRefCountZero: () => rxjs.timer(1000) }));
        const rv = new rxjs.Observable((observer) => {
            let didEmit = false;
            const subscription = shared.subscribe({
                next(value) {
                    didEmit = true;
                    observer.next(value);
                },
                error(error) {
                    observer.error(error);
                },
                complete() {
                    observer.complete();
                }
            });
            if (!didEmit && !subscription.closed) {
                observer.next(currentValue);
            }
            return subscription;
        });
        rv.getValue = () => currentValue;
        return rv;
    }

    const getGlobalRolesObservable = associate((db) => {
        return createSharedValueObservable(Dexie.liveQuery(() => db.roles
            .where({ realmId: 'rlm-public' })
            .toArray()
            .then((roles) => {
            const rv = {};
            for (const role of roles
                .slice()
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))) {
                rv[role.name] = role;
            }
            return rv;
        })), {});
    });

    const getCurrentUserEmitter = associate((db) => new rxjs.BehaviorSubject(UNAUTHORIZED_USER));

    const getInternalAccessControlObservable = associate((db) => {
        return createSharedValueObservable(getCurrentUserEmitter(db._novip).pipe(switchMap((currentUser) => Dexie.liveQuery(() => db.transaction('r', 'realms', 'members', () => Promise.all([
            db.members.where({ userId: currentUser.userId }).toArray(),
            db.realms.toArray(),
            currentUser.userId,
        ]).then(([selfMembers, realms, userId]) => {
            //console.debug(`PERMS: Result from liveQUery():`, JSON.stringify({selfMembers, realms, userId}, null, 2))
            return { selfMembers, realms, userId };
        }))))), {
            selfMembers: [],
            realms: [],
            get userId() {
                return db.cloud.currentUserId;
            },
        });
        /* let refCount = 0;
        return new Observable(observer => {
          const subscription = o.subscribe(observer);
          console.debug ('PERMS subscribe', ++refCount);
          return {
            unsubscribe() {
              console.debug ('PERMS unsubscribe', --refCount);
              subscription.unsubscribe();
            }
          }
        })*/
    });

    function mapValueObservable(o, mapper) {
        let currentValue;
        const rv = o.pipe(rxjs.map((x) => (currentValue = mapper(x))));
        rv.getValue = () => currentValue !== undefined
            ? currentValue
            : (currentValue = mapper(o.getValue()));
        return rv;
    }

    // TODO: Move to dexie-cloud-common
    function mergePermissions(...permissions) {
        if (permissions.length === 0)
            return {};
        const reduced = permissions.reduce((result, next) => {
            const ret = Object.assign({}, result);
            for (const [verb, rights] of Object.entries(next)) {
                if (verb in ret && ret[verb]) {
                    if (ret[verb] === '*')
                        continue;
                    if (rights === '*') {
                        ret[verb] = '*';
                    }
                    else if (Array.isArray(rights) && Array.isArray(ret[verb])) {
                        // Both are arrays (verb is 'add' or 'manage')
                        const r = ret;
                        const retVerb = r[verb]; // "!" because Array.isArray(ret[verb])
                        r[verb] = [...new Set([...retVerb, ...rights])];
                    }
                    else if (typeof rights === 'object' &&
                        rights &&
                        typeof ret[verb] === 'object') {
                        // Both are objects (verb is 'update')
                        const mergedRights = ret[verb]; // because we've checked that typeof ret[verb] === 'object' and earlier that not ret[verb] === '*'.
                        for (const [tableName, tableRights] of Object.entries(rights)) {
                            if (mergedRights[tableName] === '*')
                                continue;
                            if (tableRights === '*') {
                                mergedRights[tableName] = '*';
                            }
                            else if (Array.isArray(mergedRights[tableName]) &&
                                Array.isArray(tableRights)) {
                                mergedRights[tableName] = [
                                    ...new Set([...mergedRights[tableName], ...tableRights]),
                                ];
                            }
                        }
                    }
                }
                else {
                    /* This compiles without type assertions. Keeping the comment to
                       explain why we do tsignore on the next statement.
                    if (verb === "add") {
                      ret[verb] = next[verb];
                    } else if (verb === "update") {
                      ret[verb] = next[verb];
                    } else if (verb === "manage") {
                      ret[verb] = next[verb];
                    } else {
                      ret[verb] = next[verb];
                    }
                    */
                    //@ts-ignore
                    ret[verb] = next[verb];
                }
            }
            return ret;
        });
        return reduced;
    }

    const getPermissionsLookupObservable = associate((db) => {
        const o = createSharedValueObservable(rxjs.combineLatest([
            getInternalAccessControlObservable(db._novip),
            getGlobalRolesObservable(db._novip),
        ]).pipe(map(([{ selfMembers, realms, userId }, globalRoles]) => ({
            selfMembers,
            realms,
            userId,
            globalRoles,
        }))), {
            selfMembers: [],
            realms: [],
            userId: UNAUTHORIZED_USER.userId,
            globalRoles: {},
        });
        return mapValueObservable(o, ({ selfMembers, realms, userId, globalRoles }) => {
            const rv = realms
                .map((realm) => {
                const selfRealmMembers = selfMembers.filter((m) => m.realmId === realm.realmId);
                const directPermissionSets = selfRealmMembers
                    .map((m) => m.permissions)
                    .filter((p) => p);
                const rolePermissionSets = flatten(selfRealmMembers.map((m) => m.roles).filter((roleName) => roleName))
                    .map((role) => globalRoles[role])
                    .filter((role) => role)
                    .map((role) => role.permissions);
                return Object.assign(Object.assign({}, realm), { permissions: realm.owner === userId
                        ? { manage: '*' }
                        : mergePermissions(...directPermissionSets, ...rolePermissionSets) });
            })
                .reduce((p, c) => (Object.assign(Object.assign({}, p), { [c.realmId]: c })), {
                [userId]: {
                    realmId: userId,
                    owner: userId,
                    name: userId,
                    permissions: { manage: '*' },
                },
            });
            return rv;
        });
    });

    class PermissionChecker {
        constructor(permissions, tableName, isOwner) {
            this.permissions = permissions || {};
            this.tableName = tableName;
            this.isOwner = isOwner;
        }
        add(...tableNames) {
            var _a;
            // If user can manage the whole realm, return true.
            if (this.permissions.manage === '*')
                return true;
            // If user can manage given table in realm, return true
            if ((_a = this.permissions.manage) === null || _a === void 0 ? void 0 : _a.includes(this.tableName))
                return true;
            // If user can add any type, return true
            if (this.permissions.add === '*')
                return true;
            // If user can add objects into given table names in the realm, return true
            if (tableNames.every((tableName) => { var _a; return (_a = this.permissions.add) === null || _a === void 0 ? void 0 : _a.includes(tableName); })) {
                return true;
            }
            return false;
        }
        update(...props) {
            var _a, _b;
            // If user is owner of this object, or if user can manage the whole realm, return true.
            if (this.isOwner || this.permissions.manage === '*')
                return true;
            // If user can manage given table in realm, return true
            if ((_a = this.permissions.manage) === null || _a === void 0 ? void 0 : _a.includes(this.tableName))
                return true;
            // If user can update any prop in any table in this realm, return true unless
            // it regards to ownership change:
            if (this.permissions.update === '*') {
                return props.every((prop) => prop !== 'owner');
            }
            const tablePermissions = (_b = this.permissions.update) === null || _b === void 0 ? void 0 : _b[this.tableName];
            // If user can update any prop in table and realm, return true unless
            // accessing special props owner or realmId
            if (tablePermissions === '*')
                return props.every((prop) => prop !== 'owner');
            // Explicitely listed properties to allow updates on:
            return props.every((prop) => tablePermissions === null || tablePermissions === void 0 ? void 0 : tablePermissions.some((permittedProp) => permittedProp === prop || (permittedProp === '*' && prop !== 'owner')));
        }
        delete() {
            var _a;
            // If user is owner of this object, or if user can manage the whole realm, return true.
            if (this.isOwner || this.permissions.manage === '*')
                return true;
            // If user can manage given table in realm, return true
            if ((_a = this.permissions.manage) === null || _a === void 0 ? void 0 : _a.includes(this.tableName))
                return true;
            return false;
        }
    }

    function permissions(dexie, obj, tableName) {
        if (!obj)
            throw new TypeError(`Cannot check permissions of undefined or null. A Dexie Cloud object with realmId and owner expected.`);
        const { owner, realmId } = obj;
        if (!tableName) {
            if (typeof obj.table !== 'function') {
                throw new TypeError(`Missing 'table' argument to permissions and table could not be extracted from entity`);
            }
            tableName = obj.table();
        }
        const source = getPermissionsLookupObservable(dexie);
        const mapper = (permissionsLookup) => {
            // If realmId is undefined, it can be due to that the object is not yet syncified - it exists
            // locally only as the user might not yet be authenticated. This is ok and we shall treat it
            // as if the realmId is dexie.cloud.currentUserId (which is "unauthorized" by the way)
            const realm = permissionsLookup[realmId || dexie.cloud.currentUserId];
            if (!realm)
                return new PermissionChecker({}, tableName, !owner || owner === dexie.cloud.currentUserId);
            return new PermissionChecker(realm.permissions, tableName, realmId === dexie.cloud.currentUserId || owner === dexie.cloud.currentUserId);
        };
        const o = source.pipe(map(mapper));
        o.getValue = () => mapper(source.getValue());
        return o;
    }

    const getInvitesObservable = associate((db) => {
        const membersByEmail = getCurrentUserEmitter(db._novip).pipe(rxjs.switchMap((currentUser) => Dexie.liveQuery(() => db.members.where({ email: currentUser.email || '' }).toArray())));
        const permissions = getPermissionsLookupObservable(db._novip);
        const accessControl = getInternalAccessControlObservable(db._novip);
        return createSharedValueObservable(rxjs.combineLatest([membersByEmail, accessControl, permissions]).pipe(rxjs.map(([membersByEmail, accessControl, realmLookup]) => {
            const reducer = (result, m) => (Object.assign(Object.assign({}, result), { [m.id]: Object.assign(Object.assign({}, m), { realm: realmLookup[m.realmId] }) }));
            const emailMembersById = membersByEmail.reduce(reducer, {});
            const membersById = accessControl.selfMembers.reduce(reducer, emailMembersById);
            return Object.values(membersById).filter(m => !m.accepted);
        })), []);
    });

    const DEFAULT_OPTIONS = {
        nameSuffix: true,
    };
    function dexieCloud(dexie) {
        const origIdbName = dexie.name;
        //
        //
        //
        const currentUserEmitter = getCurrentUserEmitter(dexie);
        const subscriptions = [];
        let configuredProgramatically = false;
        // local sync worker - used when there's no service worker.
        let localSyncWorker = null;
        dexie.on('ready', (dexie) => __awaiter$1(this, void 0, void 0, function* () {
            try {
                yield onDbReady(dexie);
            }
            catch (error) {
                console.error(error);
                // Make sure to succeed with database open even if network is down.
            }
        }), true // true = sticky
        );
        /** Void starting subscribers after a close has happened. */
        let closed = false;
        function throwIfClosed() {
            if (closed)
                throw new Dexie__default["default"].DatabaseClosedError();
        }
        dbOnClosed(dexie, () => {
            subscriptions.forEach((subscription) => subscription.unsubscribe());
            closed = true;
            localSyncWorker && localSyncWorker.stop();
            localSyncWorker = null;
            currentUserEmitter.next(UNAUTHORIZED_USER);
        });
        dexie.cloud = {
            version: '4.0.0-beta.18',
            options: Object.assign({}, DEFAULT_OPTIONS),
            schema: null,
            serverState: null,
            get currentUserId() {
                return currentUserEmitter.value.userId || UNAUTHORIZED_USER.userId;
            },
            currentUser: currentUserEmitter,
            syncState: new rxjs.BehaviorSubject({
                phase: 'initial',
                status: 'not-started',
            }),
            persistedSyncState: new rxjs.BehaviorSubject(undefined),
            userInteraction: new rxjs.BehaviorSubject(undefined),
            webSocketStatus: new rxjs.BehaviorSubject('not-started'),
            login(hint) {
                return __awaiter$1(this, void 0, void 0, function* () {
                    const db = DexieCloudDB(dexie);
                    yield db.cloud.sync();
                    yield login(db, hint);
                });
            },
            invites: getInvitesObservable(dexie),
            roles: getGlobalRolesObservable(dexie),
            configure(options) {
                options = dexie.cloud.options = Object.assign(Object.assign({}, dexie.cloud.options), options);
                configuredProgramatically = true;
                if (options.databaseUrl && options.nameSuffix) {
                    // @ts-ignore
                    dexie.name = `${origIdbName}-${getDbNameFromDbUrl(options.databaseUrl)}`;
                    DexieCloudDB(dexie).reconfigure(); // Update observable from new dexie.name
                }
                updateSchemaFromOptions(dexie.cloud.schema, dexie.cloud.options);
            },
            sync({ wait, purpose } = { wait: true, purpose: 'push' }) {
                return __awaiter$1(this, void 0, void 0, function* () {
                    if (wait === undefined)
                        wait = true;
                    const db = DexieCloudDB(dexie);
                    if (purpose === 'pull') {
                        const syncState = db.cloud.persistedSyncState.value;
                        triggerSync(db, purpose);
                        if (wait) {
                            const newSyncState = yield db.cloud.persistedSyncState
                                .pipe(filter((newSyncState) => (newSyncState === null || newSyncState === void 0 ? void 0 : newSyncState.timestamp) != null &&
                                (!syncState || newSyncState.timestamp > syncState.timestamp)), take(1))
                                .toPromise();
                            if (newSyncState === null || newSyncState === void 0 ? void 0 : newSyncState.error) {
                                throw new Error(`Sync error: ` + newSyncState.error);
                            }
                        }
                    }
                    else if (yield isSyncNeeded(db)) {
                        const syncState = db.cloud.persistedSyncState.value;
                        triggerSync(db, purpose);
                        if (wait) {
                            console.debug('db.cloud.login() is waiting for sync completion...');
                            yield rxjs.from(Dexie.liveQuery(() => __awaiter$1(this, void 0, void 0, function* () {
                                const syncNeeded = yield isSyncNeeded(db);
                                const newSyncState = yield db.getPersistedSyncState();
                                if ((newSyncState === null || newSyncState === void 0 ? void 0 : newSyncState.timestamp) !== (syncState === null || syncState === void 0 ? void 0 : syncState.timestamp) &&
                                    (newSyncState === null || newSyncState === void 0 ? void 0 : newSyncState.error))
                                    throw new Error(`Sync error: ` + newSyncState.error);
                                return syncNeeded;
                            })))
                                .pipe(filter((isNeeded) => !isNeeded), take(1))
                                .toPromise();
                            console.debug('Done waiting for sync completion because we have nothing to push anymore');
                        }
                    }
                });
            },
            permissions(obj, tableName) {
                return permissions(dexie._novip, obj, tableName);
            },
        };
        dexie.Version.prototype['_parseStoresSpec'] = Dexie__default["default"].override(dexie.Version.prototype['_parseStoresSpec'], (origFunc) => overrideParseStoresSpec(origFunc, dexie));
        dexie.Table.prototype.newId = function ({ colocateWith } = {}) {
            const shardKey = colocateWith && colocateWith.substr(colocateWith.length - 3);
            return generateKey(dexie.cloud.schema[this.name].idPrefix || '', shardKey);
        };
        dexie.Table.prototype.idPrefix = function () {
            var _a, _b;
            return ((_b = (_a = this.db.cloud.schema) === null || _a === void 0 ? void 0 : _a[this.name]) === null || _b === void 0 ? void 0 : _b.idPrefix) || '';
        };
        dexie.use(createMutationTrackingMiddleware({
            currentUserObservable: dexie.cloud.currentUser,
            db: DexieCloudDB(dexie),
        }));
        dexie.use(createImplicitPropSetterMiddleware(DexieCloudDB(dexie)));
        dexie.use(createIdGenerationMiddleware(DexieCloudDB(dexie)));
        function onDbReady(dexie) {
            var _a, _b, _c, _d, _e, _f;
            return __awaiter$1(this, void 0, void 0, function* () {
                closed = false; // As Dexie calls us, we are not closed anymore. Maybe reopened? Remember db.ready event is registered with sticky flag!
                const db = DexieCloudDB(dexie);
                // Setup default GUI:
                if (!IS_SERVICE_WORKER) {
                    if (!((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.customLoginGui)) {
                        subscriptions.push(setupDefaultGUI(dexie));
                    }
                    subscriptions.push(computeSyncState(db).subscribe(dexie.cloud.syncState));
                }
                //verifyConfig(db.cloud.options); Not needed (yet at least!)
                // Verify the user has allowed version increment.
                if (!db.tables.every((table) => table.core)) {
                    throwVersionIncrementNeeded();
                }
                const swRegistrations = 'serviceWorker' in navigator
                    ? yield navigator.serviceWorker.getRegistrations()
                    : [];
                const initiallySynced = yield db.transaction('rw', db.$syncState, () => __awaiter$1(this, void 0, void 0, function* () {
                    var _g, _h;
                    const { options, schema } = db.cloud;
                    const [persistedOptions, persistedSchema, persistedSyncState] = yield Promise.all([
                        db.getOptions(),
                        db.getSchema(),
                        db.getPersistedSyncState(),
                    ]);
                    if (!configuredProgramatically) {
                        // Options not specified programatically (use case for SW!)
                        // Take persisted options:
                        db.cloud.options = persistedOptions || null;
                    }
                    else if (!persistedOptions ||
                        JSON.stringify(persistedOptions) !== JSON.stringify(options)) {
                        // Update persisted options:
                        if (!options)
                            throw new Error(`Internal error`); // options cannot be null if configuredProgramatically is set.
                        yield db.$syncState.put(options, 'options');
                    }
                    if (((_g = db.cloud.options) === null || _g === void 0 ? void 0 : _g.tryUseServiceWorker) &&
                        'serviceWorker' in navigator &&
                        swRegistrations.length > 0 &&
                        !DISABLE_SERVICEWORKER_STRATEGY) {
                        // * Configured for using service worker if available.
                        // * Browser supports service workers
                        // * There are at least one service worker registration
                        console.debug('Dexie Cloud Addon: Using service worker');
                        db.cloud.usingServiceWorker = true;
                    }
                    else {
                        // Not configured for using service worker or no service worker
                        // registration exists. Don't rely on service worker to do any job.
                        // Use LocalSyncWorker instead.
                        if (((_h = db.cloud.options) === null || _h === void 0 ? void 0 : _h.tryUseServiceWorker) && !IS_SERVICE_WORKER) {
                            console.debug('dexie-cloud-addon: Not using service worker.', swRegistrations.length === 0
                                ? 'No SW registrations found.'
                                : 'serviceWorker' in navigator && DISABLE_SERVICEWORKER_STRATEGY
                                    ? 'Avoiding SW background sync and SW periodic bg sync for this browser due to browser bugs.'
                                    : 'navigator.serviceWorker not present');
                        }
                        db.cloud.usingServiceWorker = false;
                    }
                    updateSchemaFromOptions(schema, db.cloud.options);
                    updateSchemaFromOptions(persistedSchema, db.cloud.options);
                    if (!schema) {
                        // Database opened dynamically (use case for SW!)
                        // Take persisted schema:
                        db.cloud.schema = persistedSchema || null;
                    }
                    else if (!persistedSchema ||
                        JSON.stringify(persistedSchema) !== JSON.stringify(schema)) {
                        // Update persisted schema (but don't overwrite table prefixes)
                        const newPersistedSchema = persistedSchema || {};
                        for (const [table, tblSchema] of Object.entries(schema)) {
                            const newTblSchema = newPersistedSchema[table];
                            if (!newTblSchema) {
                                newPersistedSchema[table] = Object.assign({}, tblSchema);
                            }
                            else {
                                newTblSchema.markedForSync = tblSchema.markedForSync;
                                tblSchema.deleted = newTblSchema.deleted;
                                newTblSchema.generatedGlobalId = tblSchema.generatedGlobalId;
                            }
                        }
                        yield db.$syncState.put(newPersistedSchema, 'schema');
                        // Make sure persisted table prefixes are being used instead of computed ones:
                        // Let's assign all props as the newPersistedSchems should be what we should be working with.
                        Object.assign(schema, newPersistedSchema);
                    }
                    return persistedSyncState === null || persistedSyncState === void 0 ? void 0 : persistedSyncState.initiallySynced;
                }));
                if (initiallySynced) {
                    db.setInitiallySynced(true);
                }
                verifySchema(db);
                if (((_b = db.cloud.options) === null || _b === void 0 ? void 0 : _b.databaseUrl) && !initiallySynced) {
                    yield performInitialSync(db, db.cloud.options, db.cloud.schema);
                    db.setInitiallySynced(true);
                }
                // Manage CurrentUser observable:
                throwIfClosed();
                if (!IS_SERVICE_WORKER) {
                    subscriptions.push(Dexie.liveQuery(() => db.getCurrentUser()).subscribe(currentUserEmitter));
                    // Manage PersistendSyncState observable:
                    subscriptions.push(Dexie.liveQuery(() => db.getPersistedSyncState()).subscribe(db.cloud.persistedSyncState));
                    // Wait till currentUser and persistedSyncState gets populated
                    // with things from the database and not just the default values.
                    // This is so that when db.open() completes, user should be safe
                    // to subscribe to these observables and get actual data.
                    yield rxjs.combineLatest([
                        currentUserEmitter.pipe(skip(1), take(1)),
                        db.cloud.persistedSyncState.pipe(skip(1), take(1)),
                    ]).toPromise();
                }
                // HERE: If requireAuth, do athentication now.
                if ((_c = db.cloud.options) === null || _c === void 0 ? void 0 : _c.requireAuth) {
                    yield login(db);
                }
                if (localSyncWorker)
                    localSyncWorker.stop();
                localSyncWorker = null;
                throwIfClosed();
                if (db.cloud.usingServiceWorker && ((_d = db.cloud.options) === null || _d === void 0 ? void 0 : _d.databaseUrl)) {
                    registerSyncEvent(db, 'push').catch(() => { });
                    registerPeriodicSyncEvent(db).catch(() => { });
                }
                else if (((_e = db.cloud.options) === null || _e === void 0 ? void 0 : _e.databaseUrl) &&
                    db.cloud.schema &&
                    !IS_SERVICE_WORKER) {
                    // There's no SW. Start SyncWorker instead.
                    localSyncWorker = LocalSyncWorker(db, db.cloud.options, db.cloud.schema);
                    localSyncWorker.start();
                    triggerSync(db, 'push');
                }
                // Listen to online event and do sync.
                throwIfClosed();
                if (!IS_SERVICE_WORKER) {
                    subscriptions.push(rxjs.fromEvent(self, 'online').subscribe(() => {
                        console.debug('online!');
                        db.syncStateChangedEvent.next({
                            phase: 'not-in-sync',
                        });
                        triggerSync(db, 'push');
                    }), rxjs.fromEvent(self, 'offline').subscribe(() => {
                        console.debug('offline!');
                        db.syncStateChangedEvent.next({
                            phase: 'offline',
                        });
                    }));
                }
                // Connect WebSocket only if we're a browser window
                if (typeof window !== 'undefined' &&
                    !IS_SERVICE_WORKER &&
                    ((_f = db.cloud.options) === null || _f === void 0 ? void 0 : _f.databaseUrl)) {
                    subscriptions.push(connectWebSocket(db));
                }
            });
        }
    }
    dexieCloud.version = '4.0.0-beta.18';
    Dexie__default["default"].Cloud = dexieCloud;

    // In case the SW lives for a while, let it reuse already opened connections:
    const managedDBs = new Map();
    function getDbNameFromTag(tag) {
        return tag.startsWith('dexie-cloud:') && tag.split(':')[1];
    }
    const syncDBSemaphore = new Map();
    function syncDB(dbName, purpose) {
        // We're taking hight for being double-signalled both
        // via message event and sync event.
        // Which one comes first doesnt matter, just
        // that we return the existing promise if there is
        // an ongoing sync.
        let promise = syncDBSemaphore.get(dbName + '/' + purpose);
        if (!promise) {
            promise = _syncDB(dbName, purpose)
                .then(() => {
                // When legacy enough across browsers, use .finally() instead of then() and catch():
                syncDBSemaphore.delete(dbName + '/' + purpose);
            })
                .catch((error) => {
                syncDBSemaphore.delete(dbName + '/' + purpose);
                return Promise.reject(error);
            });
            syncDBSemaphore.set(dbName + '/' + purpose, promise);
        }
        return promise;
        function _syncDB(dbName, purpose) {
            var _a;
            return __awaiter$1(this, void 0, void 0, function* () {
                let db = managedDBs.get(dbName);
                if (!db) {
                    console.debug('Dexie Cloud SW: Creating new Dexie instance for', dbName);
                    const dexie = new Dexie__default["default"](dbName, { addons: [dexieCloud] });
                    db = DexieCloudDB(dexie);
                    dexie.on('versionchange', stopManagingDB);
                    yield db.dx.open(); // Makes sure db.cloud.options and db.cloud.schema are read from db,
                    if (!managedDBs.get(dbName)) {
                        // Avoid race conditions.
                        managedDBs.set(dbName, db);
                    }
                }
                if (!((_a = db.cloud.options) === null || _a === void 0 ? void 0 : _a.databaseUrl)) {
                    console.error(`Dexie Cloud: No databaseUrl configured`);
                    return; // Nothing to sync.
                }
                if (!db.cloud.schema) {
                    console.error(`Dexie Cloud: No schema persisted`);
                    return; // Nothing to sync.
                }
                function stopManagingDB() {
                    db.dx.on.versionchange.unsubscribe(stopManagingDB);
                    if (managedDBs.get(db.name) === db) {
                        // Avoid race conditions.
                        managedDBs.delete(db.name);
                    }
                    console.debug(`Dexie Cloud SW: Closing Dexie instance for ${dbName}`);
                    db.dx.close();
                    return false;
                }
                try {
                    console.debug('Dexie Cloud SW: Syncing');
                    yield syncIfPossible(db, db.cloud.options, db.cloud.schema, {
                        retryImmediatelyOnFetchError: true,
                        purpose,
                    });
                    console.debug('Dexie Cloud SW: Done Syncing');
                }
                catch (e) {
                    console.error(`Dexie Cloud SW Error`, e);
                    // Error occured. Stop managing this DB until we wake up again by a sync event,
                    // which will open a new Dexie and start trying to sync it.
                    stopManagingDB();
                    if (e.name !== Dexie__default["default"].errnames.NoSuchDatabase) {
                        // Unless the error was that DB doesn't exist, rethrow to trigger sync retry.
                        throw e; // Throw e to make syncEvent.waitUntil() receive a rejected promis, so it will retry.
                    }
                }
            });
        }
    }
    // Avoid taking care of events if browser bugs out by using dexie cloud from a service worker.
    if (!DISABLE_SERVICEWORKER_STRATEGY) {
        self.addEventListener('sync', (event) => {
            console.debug('SW "sync" Event', event.tag);
            const dbName = getDbNameFromTag(event.tag);
            if (dbName) {
                event.waitUntil(syncDB(dbName, "push")); // The purpose of sync events are "push"
            }
        });
        self.addEventListener('periodicsync', (event) => {
            console.debug('SW "periodicsync" Event', event.tag);
            const dbName = getDbNameFromTag(event.tag);
            if (dbName) {
                event.waitUntil(syncDB(dbName, "pull")); // The purpose of periodic sync events are "pull"
            }
        });
        self.addEventListener('message', (event) => {
            console.debug('SW "message" Event', event.data);
            if (event.data.type === 'dexie-cloud-sync') {
                const { dbName } = event.data;
                // Mimic background sync behavior - retry in X minutes on failure.
                // But lesser timeout and more number of times.
                const syncAndRetry = (num = 1) => {
                    return syncDB(dbName, event.data.purpose || "pull").catch((e) => __awaiter$1(void 0, void 0, void 0, function* () {
                        if (num === 3)
                            throw e;
                        yield sleep(60000); // 1 minute
                        syncAndRetry(num + 1);
                    }));
                };
                if ('waitUntil' in event) {
                    event.waitUntil(syncAndRetry().catch(error => console.error(error)));
                }
                else {
                    syncAndRetry().catch(error => console.error(error));
                }
            }
        });
    }
    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

}));

// @ts-ignore
try {
    self['workbox:core:5.1.4'] && _();
}
catch (e) { }

/*
  Copyright 2019 Google LLC
  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const logger = (process.env.NODE_ENV === 'production' ? null : (() => {
    // Don't overwrite this value if it's already set.
    // See https://github.com/GoogleChrome/workbox/pull/2284#issuecomment-560470923
    if (!('__WB_DISABLE_DEV_LOGS' in self)) {
        self.__WB_DISABLE_DEV_LOGS = false;
    }
    let inGroup = false;
    const methodToColorMap = {
        debug: `#7f8c8d`,
        log: `#2ecc71`,
        warn: `#f39c12`,
        error: `#c0392b`,
        groupCollapsed: `#3498db`,
        groupEnd: null,
    };
    const print = function (method, args) {
        if (self.__WB_DISABLE_DEV_LOGS) {
            return;
        }
        if (method === 'groupCollapsed') {
            // Safari doesn't print all console.groupCollapsed() arguments:
            // https://bugs.webkit.org/show_bug.cgi?id=182754
            if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
                console[method](...args);
                return;
            }
        }
        const styles = [
            `background: ${methodToColorMap[method]}`,
            `border-radius: 0.5em`,
            `color: white`,
            `font-weight: bold`,
            `padding: 2px 0.5em`,
        ];
        // When in a group, the workbox prefix is not displayed.
        const logPrefix = inGroup ? [] : ['%cworkbox', styles.join(';')];
        console[method](...logPrefix, ...args);
        if (method === 'groupCollapsed') {
            inGroup = true;
        }
        if (method === 'groupEnd') {
            inGroup = false;
        }
    };
    const api = {};
    const loggerMethods = Object.keys(methodToColorMap);
    for (const key of loggerMethods) {
        const method = key;
        api[method] = (...args) => {
            print(method, args);
        };
    }
    return api;
})());

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const messages$1 = {
    'invalid-value': ({ paramName, validValueDescription, value }) => {
        if (!paramName || !validValueDescription) {
            throw new Error(`Unexpected input to 'invalid-value' error.`);
        }
        return `The '${paramName}' parameter was given a value with an ` +
            `unexpected value. ${validValueDescription} Received a value of ` +
            `${JSON.stringify(value)}.`;
    },
    'not-an-array': ({ moduleName, className, funcName, paramName }) => {
        if (!moduleName || !className || !funcName || !paramName) {
            throw new Error(`Unexpected input to 'not-an-array' error.`);
        }
        return `The parameter '${paramName}' passed into ` +
            `'${moduleName}.${className}.${funcName}()' must be an array.`;
    },
    'incorrect-type': ({ expectedType, paramName, moduleName, className, funcName }) => {
        if (!expectedType || !paramName || !moduleName || !funcName) {
            throw new Error(`Unexpected input to 'incorrect-type' error.`);
        }
        return `The parameter '${paramName}' passed into ` +
            `'${moduleName}.${className ? (className + '.') : ''}` +
            `${funcName}()' must be of type ${expectedType}.`;
    },
    'incorrect-class': ({ expectedClass, paramName, moduleName, className, funcName, isReturnValueProblem }) => {
        if (!expectedClass || !moduleName || !funcName) {
            throw new Error(`Unexpected input to 'incorrect-class' error.`);
        }
        if (isReturnValueProblem) {
            return `The return value from ` +
                `'${moduleName}.${className ? (className + '.') : ''}${funcName}()' ` +
                `must be an instance of class ${expectedClass.name}.`;
        }
        return `The parameter '${paramName}' passed into ` +
            `'${moduleName}.${className ? (className + '.') : ''}${funcName}()' ` +
            `must be an instance of class ${expectedClass.name}.`;
    },
    'missing-a-method': ({ expectedMethod, paramName, moduleName, className, funcName }) => {
        if (!expectedMethod || !paramName || !moduleName || !className
            || !funcName) {
            throw new Error(`Unexpected input to 'missing-a-method' error.`);
        }
        return `${moduleName}.${className}.${funcName}() expected the ` +
            `'${paramName}' parameter to expose a '${expectedMethod}' method.`;
    },
    'add-to-cache-list-unexpected-type': ({ entry }) => {
        return `An unexpected entry was passed to ` +
            `'workbox-precaching.PrecacheController.addToCacheList()' The entry ` +
            `'${JSON.stringify(entry)}' isn't supported. You must supply an array of ` +
            `strings with one or more characters, objects with a url property or ` +
            `Request objects.`;
    },
    'add-to-cache-list-conflicting-entries': ({ firstEntry, secondEntry }) => {
        if (!firstEntry || !secondEntry) {
            throw new Error(`Unexpected input to ` +
                `'add-to-cache-list-duplicate-entries' error.`);
        }
        return `Two of the entries passed to ` +
            `'workbox-precaching.PrecacheController.addToCacheList()' had the URL ` +
            `${firstEntry._entryId} but different revision details. Workbox is ` +
            `unable to cache and version the asset correctly. Please remove one ` +
            `of the entries.`;
    },
    'plugin-error-request-will-fetch': ({ thrownError }) => {
        if (!thrownError) {
            throw new Error(`Unexpected input to ` +
                `'plugin-error-request-will-fetch', error.`);
        }
        return `An error was thrown by a plugins 'requestWillFetch()' method. ` +
            `The thrown error message was: '${thrownError.message}'.`;
    },
    'invalid-cache-name': ({ cacheNameId, value }) => {
        if (!cacheNameId) {
            throw new Error(`Expected a 'cacheNameId' for error 'invalid-cache-name'`);
        }
        return `You must provide a name containing at least one character for ` +
            `setCacheDetails({${cacheNameId}: '...'}). Received a value of ` +
            `'${JSON.stringify(value)}'`;
    },
    'unregister-route-but-not-found-with-method': ({ method }) => {
        if (!method) {
            throw new Error(`Unexpected input to ` +
                `'unregister-route-but-not-found-with-method' error.`);
        }
        return `The route you're trying to unregister was not  previously ` +
            `registered for the method type '${method}'.`;
    },
    'unregister-route-route-not-registered': () => {
        return `The route you're trying to unregister was not previously ` +
            `registered.`;
    },
    'queue-replay-failed': ({ name }) => {
        return `Replaying the background sync queue '${name}' failed.`;
    },
    'duplicate-queue-name': ({ name }) => {
        return `The Queue name '${name}' is already being used. ` +
            `All instances of backgroundSync.Queue must be given unique names.`;
    },
    'expired-test-without-max-age': ({ methodName, paramName }) => {
        return `The '${methodName}()' method can only be used when the ` +
            `'${paramName}' is used in the constructor.`;
    },
    'unsupported-route-type': ({ moduleName, className, funcName, paramName }) => {
        return `The supplied '${paramName}' parameter was an unsupported type. ` +
            `Please check the docs for ${moduleName}.${className}.${funcName} for ` +
            `valid input types.`;
    },
    'not-array-of-class': ({ value, expectedClass, moduleName, className, funcName, paramName }) => {
        return `The supplied '${paramName}' parameter must be an array of ` +
            `'${expectedClass}' objects. Received '${JSON.stringify(value)},'. ` +
            `Please check the call to ${moduleName}.${className}.${funcName}() ` +
            `to fix the issue.`;
    },
    'max-entries-or-age-required': ({ moduleName, className, funcName }) => {
        return `You must define either config.maxEntries or config.maxAgeSeconds` +
            `in ${moduleName}.${className}.${funcName}`;
    },
    'statuses-or-headers-required': ({ moduleName, className, funcName }) => {
        return `You must define either config.statuses or config.headers` +
            `in ${moduleName}.${className}.${funcName}`;
    },
    'invalid-string': ({ moduleName, funcName, paramName }) => {
        if (!paramName || !moduleName || !funcName) {
            throw new Error(`Unexpected input to 'invalid-string' error.`);
        }
        return `When using strings, the '${paramName}' parameter must start with ` +
            `'http' (for cross-origin matches) or '/' (for same-origin matches). ` +
            `Please see the docs for ${moduleName}.${funcName}() for ` +
            `more info.`;
    },
    'channel-name-required': () => {
        return `You must provide a channelName to construct a ` +
            `BroadcastCacheUpdate instance.`;
    },
    'invalid-responses-are-same-args': () => {
        return `The arguments passed into responsesAreSame() appear to be ` +
            `invalid. Please ensure valid Responses are used.`;
    },
    'expire-custom-caches-only': () => {
        return `You must provide a 'cacheName' property when using the ` +
            `expiration plugin with a runtime caching strategy.`;
    },
    'unit-must-be-bytes': ({ normalizedRangeHeader }) => {
        if (!normalizedRangeHeader) {
            throw new Error(`Unexpected input to 'unit-must-be-bytes' error.`);
        }
        return `The 'unit' portion of the Range header must be set to 'bytes'. ` +
            `The Range header provided was "${normalizedRangeHeader}"`;
    },
    'single-range-only': ({ normalizedRangeHeader }) => {
        if (!normalizedRangeHeader) {
            throw new Error(`Unexpected input to 'single-range-only' error.`);
        }
        return `Multiple ranges are not supported. Please use a  single start ` +
            `value, and optional end value. The Range header provided was ` +
            `"${normalizedRangeHeader}"`;
    },
    'invalid-range-values': ({ normalizedRangeHeader }) => {
        if (!normalizedRangeHeader) {
            throw new Error(`Unexpected input to 'invalid-range-values' error.`);
        }
        return `The Range header is missing both start and end values. At least ` +
            `one of those values is needed. The Range header provided was ` +
            `"${normalizedRangeHeader}"`;
    },
    'no-range-header': () => {
        return `No Range header was found in the Request provided.`;
    },
    'range-not-satisfiable': ({ size, start, end }) => {
        return `The start (${start}) and end (${end}) values in the Range are ` +
            `not satisfiable by the cached response, which is ${size} bytes.`;
    },
    'attempt-to-cache-non-get-request': ({ url, method }) => {
        return `Unable to cache '${url}' because it is a '${method}' request and ` +
            `only 'GET' requests can be cached.`;
    },
    'cache-put-with-no-response': ({ url }) => {
        return `There was an attempt to cache '${url}' but the response was not ` +
            `defined.`;
    },
    'no-response': ({ url, error }) => {
        let message = `The strategy could not generate a response for '${url}'.`;
        if (error) {
            message += ` The underlying error is ${error}.`;
        }
        return message;
    },
    'bad-precaching-response': ({ url, status }) => {
        return `The precaching request for '${url}' failed with an HTTP ` +
            `status of ${status}.`;
    },
    'non-precached-url': ({ url }) => {
        return `createHandlerBoundToURL('${url}') was called, but that URL is ` +
            `not precached. Please pass in a URL that is precached instead.`;
    },
    'add-to-cache-list-conflicting-integrities': ({ url }) => {
        return `Two of the entries passed to ` +
            `'workbox-precaching.PrecacheController.addToCacheList()' had the URL ` +
            `${url} with different integrity values. Please remove one of them.`;
    },
    'missing-precache-entry': ({ cacheName, url }) => {
        return `Unable to find a precached response in ${cacheName} for ${url}.`;
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const fallback = (code, ...args) => {
    let msg = code;
    if (args.length > 0) {
        msg += ` :: ${JSON.stringify(args)}`;
    }
    return msg;
};
const generatorFunction = (code, details = {}) => {
    const message = messages$1[code];
    if (!message) {
        throw new Error(`Unable to find message for code '${code}'.`);
    }
    return message(details);
};
const messageGenerator = (process.env.NODE_ENV === 'production') ?
    fallback : generatorFunction;

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Workbox errors should be thrown with this class.
 * This allows use to ensure the type easily in tests,
 * helps developers identify errors from workbox
 * easily and allows use to optimise error
 * messages correctly.
 *
 * @private
 */
class WorkboxError extends Error {
    /**
     *
     * @param {string} errorCode The error code that
     * identifies this particular error.
     * @param {Object=} details Any relevant arguments
     * that will help developers identify issues should
     * be added as a key on the context object.
     */
    constructor(errorCode, details) {
        const message = messageGenerator(errorCode, details);
        super(message);
        this.name = errorCode;
        this.details = details;
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/*
 * This method throws if the supplied value is not an array.
 * The destructed values are required to produce a meaningful error for users.
 * The destructed and restructured object is so it's clear what is
 * needed.
 */
const isArray = (value, details) => {
    if (!Array.isArray(value)) {
        throw new WorkboxError('not-an-array', details);
    }
};
const hasMethod = (object, expectedMethod, details) => {
    const type = typeof object[expectedMethod];
    if (type !== 'function') {
        details['expectedMethod'] = expectedMethod;
        throw new WorkboxError('missing-a-method', details);
    }
};
const isType = (object, expectedType, details) => {
    if (typeof object !== expectedType) {
        details['expectedType'] = expectedType;
        throw new WorkboxError('incorrect-type', details);
    }
};
const isInstance = (object, expectedClass, details) => {
    if (!(object instanceof expectedClass)) {
        details['expectedClass'] = expectedClass;
        throw new WorkboxError('incorrect-class', details);
    }
};
const isOneOf = (value, validValues, details) => {
    if (!validValues.includes(value)) {
        details['validValueDescription'] =
            `Valid values are ${JSON.stringify(validValues)}.`;
        throw new WorkboxError('invalid-value', details);
    }
};
const isArrayOfClass = (value, expectedClass, details) => {
    const error = new WorkboxError('not-array-of-class', details);
    if (!Array.isArray(value)) {
        throw error;
    }
    for (const item of value) {
        if (!(item instanceof expectedClass)) {
            throw error;
        }
    }
};
const finalAssertExports = process.env.NODE_ENV === 'production' ? null : {
    hasMethod,
    isArray,
    isInstance,
    isOneOf,
    isType,
    isArrayOfClass,
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
// Callbacks to be executed whenever there's a quota error.
const quotaErrorCallbacks = new Set();

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Adds a function to the set of quotaErrorCallbacks that will be executed if
 * there's a quota error.
 *
 * @param {Function} callback
 * @memberof module:workbox-core
 */
function registerQuotaErrorCallback(callback) {
    if (process.env.NODE_ENV !== 'production') {
        finalAssertExports.isType(callback, 'function', {
            moduleName: 'workbox-core',
            funcName: 'register',
            paramName: 'callback',
        });
    }
    quotaErrorCallbacks.add(callback);
    if (process.env.NODE_ENV !== 'production') {
        logger.log('Registered a callback to respond to quota errors.', callback);
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const _cacheNameDetails = {
    googleAnalytics: 'googleAnalytics',
    precache: 'precache-v2',
    prefix: 'workbox',
    runtime: 'runtime',
    suffix: typeof registration !== 'undefined' ? registration.scope : '',
};
const _createCacheName = (cacheName) => {
    return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix]
        .filter((value) => value && value.length > 0)
        .join('-');
};
const eachCacheNameDetail = (fn) => {
    for (const key of Object.keys(_cacheNameDetails)) {
        fn(key);
    }
};
const cacheNames = {
    updateDetails: (details) => {
        eachCacheNameDetail((key) => {
            if (typeof details[key] === 'string') {
                _cacheNameDetails[key] = details[key];
            }
        });
    },
    getGoogleAnalyticsName: (userCacheName) => {
        return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
        return userCacheName || _createCacheName(_cacheNameDetails.precache);
    },
    getPrefix: () => {
        return _cacheNameDetails.prefix;
    },
    getRuntimeName: (userCacheName) => {
        return userCacheName || _createCacheName(_cacheNameDetails.runtime);
    },
    getSuffix: () => {
        return _cacheNameDetails.suffix;
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Runs all of the callback functions, one at a time sequentially, in the order
 * in which they were registered.
 *
 * @memberof module:workbox-core
 * @private
 */
async function executeQuotaErrorCallbacks() {
    if (process.env.NODE_ENV !== 'production') {
        logger.log(`About to run ${quotaErrorCallbacks.size} ` +
            `callbacks to clean up caches.`);
    }
    for (const callback of quotaErrorCallbacks) {
        await callback();
        if (process.env.NODE_ENV !== 'production') {
            logger.log(callback, 'is complete.');
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        logger.log('Finished running callbacks.');
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const getFriendlyURL = (url) => {
    const urlObj = new URL(String(url), location.href);
    // See https://github.com/GoogleChrome/workbox/issues/2323
    // We want to include everything, except for the origin if it's same-origin.
    return urlObj.href.replace(new RegExp(`^${location.origin}`), '');
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const pluginUtils = {
    filter: (plugins, callbackName) => {
        return plugins.filter((plugin) => callbackName in plugin);
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Checks the list of plugins for the cacheKeyWillBeUsed callback, and
 * executes any of those callbacks found in sequence. The final `Request` object
 * returned by the last plugin is treated as the cache key for cache reads
 * and/or writes.
 *
 * @param {Object} options
 * @param {Request} options.request
 * @param {string} options.mode
 * @param {Array<Object>} [options.plugins=[]]
 * @return {Promise<Request>}
 *
 * @private
 * @memberof module:workbox-core
 */
const _getEffectiveRequest = async ({ request, mode, plugins = [], }) => {
    const cacheKeyWillBeUsedPlugins = pluginUtils.filter(plugins, "cacheKeyWillBeUsed" /* CACHE_KEY_WILL_BE_USED */);
    let effectiveRequest = request;
    for (const plugin of cacheKeyWillBeUsedPlugins) {
        effectiveRequest = await plugin["cacheKeyWillBeUsed" /* CACHE_KEY_WILL_BE_USED */].call(plugin, { mode, request: effectiveRequest });
        if (typeof effectiveRequest === 'string') {
            effectiveRequest = new Request(effectiveRequest);
        }
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isInstance(effectiveRequest, Request, {
                moduleName: 'Plugin',
                funcName: "cacheKeyWillBeUsed" /* CACHE_KEY_WILL_BE_USED */,
                isReturnValueProblem: true,
            });
        }
    }
    return effectiveRequest;
};
/**
 * This method will call cacheWillUpdate on the available plugins (or use
 * status === 200) to determine if the Response is safe and valid to cache.
 *
 * @param {Object} options
 * @param {Request} options.request
 * @param {Response} options.response
 * @param {Event} [options.event]
 * @param {Array<Object>} [options.plugins=[]]
 * @return {Promise<Response>}
 *
 * @private
 * @memberof module:workbox-core
 */
const _isResponseSafeToCache = async ({ request, response, event, plugins = [], }) => {
    let responseToCache = response;
    let pluginsUsed = false;
    for (const plugin of plugins) {
        if ("cacheWillUpdate" /* CACHE_WILL_UPDATE */ in plugin) {
            pluginsUsed = true;
            const pluginMethod = plugin["cacheWillUpdate" /* CACHE_WILL_UPDATE */];
            responseToCache = await pluginMethod.call(plugin, {
                request,
                response: responseToCache,
                event,
            });
            if (process.env.NODE_ENV !== 'production') {
                if (responseToCache) {
                    finalAssertExports.isInstance(responseToCache, Response, {
                        moduleName: 'Plugin',
                        funcName: "cacheWillUpdate" /* CACHE_WILL_UPDATE */,
                        isReturnValueProblem: true,
                    });
                }
            }
            if (!responseToCache) {
                break;
            }
        }
    }
    if (!pluginsUsed) {
        if (process.env.NODE_ENV !== 'production') {
            if (responseToCache) {
                if (responseToCache.status !== 200) {
                    if (responseToCache.status === 0) {
                        logger.warn(`The response for '${request.url}' is an opaque ` +
                            `response. The caching strategy that you're using will not ` +
                            `cache opaque responses by default.`);
                    }
                    else {
                        logger.debug(`The response for '${request.url}' returned ` +
                            `a status code of '${response.status}' and won't be cached as a ` +
                            `result.`);
                    }
                }
            }
        }
        responseToCache = responseToCache && responseToCache.status === 200 ?
            responseToCache : undefined;
    }
    return responseToCache ? responseToCache : null;
};
/**
 * This is a wrapper around cache.match().
 *
 * @param {Object} options
 * @param {string} options.cacheName Name of the cache to match against.
 * @param {Request} options.request The Request that will be used to look up
 *     cache entries.
 * @param {Event} [options.event] The event that prompted the action.
 * @param {Object} [options.matchOptions] Options passed to cache.match().
 * @param {Array<Object>} [options.plugins=[]] Array of plugins.
 * @return {Response} A cached response if available.
 *
 * @private
 * @memberof module:workbox-core
 */
const matchWrapper = async ({ cacheName, request, event, matchOptions, plugins = [], }) => {
    const cache = await self.caches.open(cacheName);
    const effectiveRequest = await _getEffectiveRequest({
        plugins, request, mode: 'read'
    });
    let cachedResponse = await cache.match(effectiveRequest, matchOptions);
    if (process.env.NODE_ENV !== 'production') {
        if (cachedResponse) {
            logger.debug(`Found a cached response in '${cacheName}'.`);
        }
        else {
            logger.debug(`No cached response found in '${cacheName}'.`);
        }
    }
    for (const plugin of plugins) {
        if ("cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */ in plugin) {
            const pluginMethod = plugin["cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */];
            cachedResponse = await pluginMethod.call(plugin, {
                cacheName,
                event,
                matchOptions,
                cachedResponse,
                request: effectiveRequest,
            });
            if (process.env.NODE_ENV !== 'production') {
                if (cachedResponse) {
                    finalAssertExports.isInstance(cachedResponse, Response, {
                        moduleName: 'Plugin',
                        funcName: "cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */,
                        isReturnValueProblem: true,
                    });
                }
            }
        }
    }
    return cachedResponse;
};
/**
 * Wrapper around cache.put().
 *
 * Will call `cacheDidUpdate` on plugins if the cache was updated, using
 * `matchOptions` when determining what the old entry is.
 *
 * @param {Object} options
 * @param {string} options.cacheName
 * @param {Request} options.request
 * @param {Response} options.response
 * @param {Event} [options.event]
 * @param {Array<Object>} [options.plugins=[]]
 * @param {Object} [options.matchOptions]
 *
 * @private
 * @memberof module:workbox-core
 */
const putWrapper = async ({ cacheName, request, response, event, plugins = [], matchOptions, }) => {
    if (process.env.NODE_ENV !== 'production') {
        if (request.method && request.method !== 'GET') {
            throw new WorkboxError('attempt-to-cache-non-get-request', {
                url: getFriendlyURL(request.url),
                method: request.method,
            });
        }
    }
    const effectiveRequest = await _getEffectiveRequest({
        plugins, request, mode: 'write'
    });
    if (!response) {
        if (process.env.NODE_ENV !== 'production') {
            logger.error(`Cannot cache non-existent response for ` +
                `'${getFriendlyURL(effectiveRequest.url)}'.`);
        }
        throw new WorkboxError('cache-put-with-no-response', {
            url: getFriendlyURL(effectiveRequest.url),
        });
    }
    const responseToCache = await _isResponseSafeToCache({
        event,
        plugins,
        response,
        request: effectiveRequest,
    });
    if (!responseToCache) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Response '${getFriendlyURL(effectiveRequest.url)}' will ` +
                `not be cached.`, responseToCache);
        }
        return;
    }
    const cache = await self.caches.open(cacheName);
    const updatePlugins = pluginUtils.filter(plugins, "cacheDidUpdate" /* CACHE_DID_UPDATE */);
    const oldResponse = updatePlugins.length > 0 ?
        await matchWrapper({ cacheName, matchOptions, request: effectiveRequest }) :
        null;
    if (process.env.NODE_ENV !== 'production') {
        logger.debug(`Updating the '${cacheName}' cache with a new Response for ` +
            `${getFriendlyURL(effectiveRequest.url)}.`);
    }
    try {
        await cache.put(effectiveRequest, responseToCache);
    }
    catch (error) {
        // See https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-QuotaExceededError
        if (error.name === 'QuotaExceededError') {
            await executeQuotaErrorCallbacks();
        }
        throw error;
    }
    for (const plugin of updatePlugins) {
        await plugin["cacheDidUpdate" /* CACHE_DID_UPDATE */].call(plugin, {
            cacheName,
            event,
            oldResponse,
            newResponse: responseToCache,
            request: effectiveRequest,
        });
    }
};
const cacheWrapper = {
    put: putWrapper,
    match: matchWrapper,
};

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
let supportStatus;
/**
 * A utility function that determines whether the current browser supports
 * constructing a new `Response` from a `response.body` stream.
 *
 * @return {boolean} `true`, if the current browser can successfully
 *     construct a `Response` from a `response.body` stream, `false` otherwise.
 *
 * @private
 */
function canConstructResponseFromBodyStream() {
    if (supportStatus === undefined) {
        const testResponse = new Response('');
        if ('body' in testResponse) {
            try {
                new Response(testResponse.body);
                supportStatus = true;
            }
            catch (error) {
                supportStatus = false;
            }
        }
        supportStatus = false;
    }
    return supportStatus;
}

/*
  Copyright 2019 Google LLC
  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * A helper function that prevents a promise from being flagged as unused.
 *
 * @private
 **/
function dontWaitFor(promise) {
    // Effective no-op.
    promise.then(() => { });
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * A class that wraps common IndexedDB functionality in a promise-based API.
 * It exposes all the underlying power and functionality of IndexedDB, but
 * wraps the most commonly used features in a way that's much simpler to use.
 *
 * @private
 */
class DBWrapper {
    /**
     * @param {string} name
     * @param {number} version
     * @param {Object=} [callback]
     * @param {!Function} [callbacks.onupgradeneeded]
     * @param {!Function} [callbacks.onversionchange] Defaults to
     *     DBWrapper.prototype._onversionchange when not specified.
     * @private
     */
    constructor(name, version, { onupgradeneeded, onversionchange, } = {}) {
        this._db = null;
        this._name = name;
        this._version = version;
        this._onupgradeneeded = onupgradeneeded;
        this._onversionchange = onversionchange || (() => this.close());
    }
    /**
     * Returns the IDBDatabase instance (not normally needed).
     * @return {IDBDatabase|undefined}
     *
     * @private
     */
    get db() {
        return this._db;
    }
    /**
     * Opens a connected to an IDBDatabase, invokes any onupgradedneeded
     * callback, and added an onversionchange callback to the database.
     *
     * @return {IDBDatabase}
     * @private
     */
    async open() {
        if (this._db)
            return;
        this._db = await new Promise((resolve, reject) => {
            // This flag is flipped to true if the timeout callback runs prior
            // to the request failing or succeeding. Note: we use a timeout instead
            // of an onblocked handler since there are cases where onblocked will
            // never never run. A timeout better handles all possible scenarios:
            // https://github.com/w3c/IndexedDB/issues/223
            let openRequestTimedOut = false;
            setTimeout(() => {
                openRequestTimedOut = true;
                reject(new Error('The open request was blocked and timed out'));
            }, this.OPEN_TIMEOUT);
            const openRequest = indexedDB.open(this._name, this._version);
            openRequest.onerror = () => reject(openRequest.error);
            openRequest.onupgradeneeded = (evt) => {
                if (openRequestTimedOut) {
                    openRequest.transaction.abort();
                    openRequest.result.close();
                }
                else if (typeof this._onupgradeneeded === 'function') {
                    this._onupgradeneeded(evt);
                }
            };
            openRequest.onsuccess = () => {
                const db = openRequest.result;
                if (openRequestTimedOut) {
                    db.close();
                }
                else {
                    db.onversionchange = this._onversionchange.bind(this);
                    resolve(db);
                }
            };
        });
        return this;
    }
    /**
     * Polyfills the native `getKey()` method. Note, this is overridden at
     * runtime if the browser supports the native method.
     *
     * @param {string} storeName
     * @param {*} query
     * @return {Array}
     * @private
     */
    async getKey(storeName, query) {
        return (await this.getAllKeys(storeName, query, 1))[0];
    }
    /**
     * Polyfills the native `getAll()` method. Note, this is overridden at
     * runtime if the browser supports the native method.
     *
     * @param {string} storeName
     * @param {*} query
     * @param {number} count
     * @return {Array}
     * @private
     */
    async getAll(storeName, query, count) {
        return await this.getAllMatching(storeName, { query, count });
    }
    /**
     * Polyfills the native `getAllKeys()` method. Note, this is overridden at
     * runtime if the browser supports the native method.
     *
     * @param {string} storeName
     * @param {*} query
     * @param {number} count
     * @return {Array}
     * @private
     */
    async getAllKeys(storeName, query, count) {
        const entries = await this.getAllMatching(storeName, { query, count, includeKeys: true });
        return entries.map((entry) => entry.key);
    }
    /**
     * Supports flexible lookup in an object store by specifying an index,
     * query, direction, and count. This method returns an array of objects
     * with the signature .
     *
     * @param {string} storeName
     * @param {Object} [opts]
     * @param {string} [opts.index] The index to use (if specified).
     * @param {*} [opts.query]
     * @param {IDBCursorDirection} [opts.direction]
     * @param {number} [opts.count] The max number of results to return.
     * @param {boolean} [opts.includeKeys] When true, the structure of the
     *     returned objects is changed from an array of values to an array of
     *     objects in the form {key, primaryKey, value}.
     * @return {Array}
     * @private
     */
    async getAllMatching(storeName, { index, query = null, // IE/Edge errors if query === `undefined`.
    direction = 'next', count, includeKeys = false, } = {}) {
        return await this.transaction([storeName], 'readonly', (txn, done) => {
            const store = txn.objectStore(storeName);
            const target = index ? store.index(index) : store;
            const results = [];
            const request = target.openCursor(query, direction);
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    results.push(includeKeys ? cursor : cursor.value);
                    if (count && results.length >= count) {
                        done(results);
                    }
                    else {
                        cursor.continue();
                    }
                }
                else {
                    done(results);
                }
            };
        });
    }
    /**
     * Accepts a list of stores, a transaction type, and a callback and
     * performs a transaction. A promise is returned that resolves to whatever
     * value the callback chooses. The callback holds all the transaction logic
     * and is invoked with two arguments:
     *   1. The IDBTransaction object
     *   2. A `done` function, that's used to resolve the promise when
     *      when the transaction is done, if passed a value, the promise is
     *      resolved to that value.
     *
     * @param {Array<string>} storeNames An array of object store names
     *     involved in the transaction.
     * @param {string} type Can be `readonly` or `readwrite`.
     * @param {!Function} callback
     * @return {*} The result of the transaction ran by the callback.
     * @private
     */
    async transaction(storeNames, type, callback) {
        await this.open();
        return await new Promise((resolve, reject) => {
            const txn = this._db.transaction(storeNames, type);
            txn.onabort = () => reject(txn.error);
            txn.oncomplete = () => resolve();
            callback(txn, (value) => resolve(value));
        });
    }
    /**
     * Delegates async to a native IDBObjectStore method.
     *
     * @param {string} method The method name.
     * @param {string} storeName The object store name.
     * @param {string} type Can be `readonly` or `readwrite`.
     * @param {...*} args The list of args to pass to the native method.
     * @return {*} The result of the transaction.
     * @private
     */
    async _call(method, storeName, type, ...args) {
        const callback = (txn, done) => {
            const objStore = txn.objectStore(storeName);
            // TODO(philipwalton): Fix this underlying TS2684 error.
            // @ts-ignore
            const request = objStore[method].apply(objStore, args);
            request.onsuccess = () => done(request.result);
        };
        return await this.transaction([storeName], type, callback);
    }
    /**
     * Closes the connection opened by `DBWrapper.open()`. Generally this method
     * doesn't need to be called since:
     *   1. It's usually better to keep a connection open since opening
     *      a new connection is somewhat slow.
     *   2. Connections are automatically closed when the reference is
     *      garbage collected.
     * The primary use case for needing to close a connection is when another
     * reference (typically in another tab) needs to upgrade it and would be
     * blocked by the current, open connection.
     *
     * @private
     */
    close() {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }
}
// Exposed on the prototype to let users modify the default timeout on a
// per-instance or global basis.
DBWrapper.prototype.OPEN_TIMEOUT = 2000;
// Wrap native IDBObjectStore methods according to their mode.
const methodsToWrap = {
    readonly: ['get', 'count', 'getKey', 'getAll', 'getAllKeys'],
    readwrite: ['add', 'put', 'clear', 'delete'],
};
for (const [mode, methods] of Object.entries(methodsToWrap)) {
    for (const method of methods) {
        if (method in IDBObjectStore.prototype) {
            // Don't use arrow functions here since we're outside of the class.
            DBWrapper.prototype[method] =
                async function (storeName, ...args) {
                    return await this._call(method, storeName, mode, ...args);
                };
        }
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Deletes the database.
 * Note: this is exported separately from the DBWrapper module because most
 * usages of IndexedDB in workbox dont need deleting, and this way it can be
 * reused in tests to delete databases without creating DBWrapper instances.
 *
 * @param {string} name The database name.
 * @private
 */
const deleteDatabase = async (name) => {
    await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onerror = () => {
            reject(request.error);
        };
        request.onblocked = () => {
            reject(new Error('Delete blocked'));
        };
        request.onsuccess = () => {
            resolve();
        };
    });
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Wrapper around the fetch API.
 *
 * Will call requestWillFetch on available plugins.
 *
 * @param {Object} options
 * @param {Request|string} options.request
 * @param {Object} [options.fetchOptions]
 * @param {ExtendableEvent} [options.event]
 * @param {Array<Object>} [options.plugins=[]]
 * @return {Promise<Response>}
 *
 * @private
 * @memberof module:workbox-core
 */
const wrappedFetch = async ({ request, fetchOptions, event, plugins = [], }) => {
    if (typeof request === 'string') {
        request = new Request(request);
    }
    // We *should* be able to call `await event.preloadResponse` even if it's
    // undefined, but for some reason, doing so leads to errors in our Node unit
    // tests. To work around that, explicitly check preloadResponse's value first.
    if (event instanceof FetchEvent && event.preloadResponse) {
        const possiblePreloadResponse = await event.preloadResponse;
        if (possiblePreloadResponse) {
            if (process.env.NODE_ENV !== 'production') {
                logger.log(`Using a preloaded navigation response for ` +
                    `'${getFriendlyURL(request.url)}'`);
            }
            return possiblePreloadResponse;
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        finalAssertExports.isInstance(request, Request, {
            paramName: 'request',
            expectedClass: Request,
            moduleName: 'workbox-core',
            className: 'fetchWrapper',
            funcName: 'wrappedFetch',
        });
    }
    const failedFetchPlugins = pluginUtils.filter(plugins, "fetchDidFail" /* FETCH_DID_FAIL */);
    // If there is a fetchDidFail plugin, we need to save a clone of the
    // original request before it's either modified by a requestWillFetch
    // plugin or before the original request's body is consumed via fetch().
    const originalRequest = failedFetchPlugins.length > 0 ?
        request.clone() : null;
    try {
        for (const plugin of plugins) {
            if ("requestWillFetch" /* REQUEST_WILL_FETCH */ in plugin) {
                const pluginMethod = plugin["requestWillFetch" /* REQUEST_WILL_FETCH */];
                const requestClone = request.clone();
                request = await pluginMethod.call(plugin, {
                    request: requestClone,
                    event,
                });
                if (process.env.NODE_ENV !== 'production') {
                    if (request) {
                        finalAssertExports.isInstance(request, Request, {
                            moduleName: 'Plugin',
                            funcName: "cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */,
                            isReturnValueProblem: true,
                        });
                    }
                }
            }
        }
    }
    catch (err) {
        throw new WorkboxError('plugin-error-request-will-fetch', {
            thrownError: err,
        });
    }
    // The request can be altered by plugins with `requestWillFetch` making
    // the original request (Most likely from a `fetch` event) to be different
    // to the Request we make. Pass both to `fetchDidFail` to aid debugging.
    const pluginFilteredRequest = request.clone();
    try {
        let fetchResponse;
        // See https://github.com/GoogleChrome/workbox/issues/1796
        if (request.mode === 'navigate') {
            fetchResponse = await fetch(request);
        }
        else {
            fetchResponse = await fetch(request, fetchOptions);
        }
        if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Network request for ` +
                `'${getFriendlyURL(request.url)}' returned a response with ` +
                `status '${fetchResponse.status}'.`);
        }
        for (const plugin of plugins) {
            if ("fetchDidSucceed" /* FETCH_DID_SUCCEED */ in plugin) {
                fetchResponse = await plugin["fetchDidSucceed" /* FETCH_DID_SUCCEED */]
                    .call(plugin, {
                    event,
                    request: pluginFilteredRequest,
                    response: fetchResponse,
                });
                if (process.env.NODE_ENV !== 'production') {
                    if (fetchResponse) {
                        finalAssertExports.isInstance(fetchResponse, Response, {
                            moduleName: 'Plugin',
                            funcName: "fetchDidSucceed" /* FETCH_DID_SUCCEED */,
                            isReturnValueProblem: true,
                        });
                    }
                }
            }
        }
        return fetchResponse;
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.error(`Network request for ` +
                `'${getFriendlyURL(request.url)}' threw an error.`, error);
        }
        for (const plugin of failedFetchPlugins) {
            await plugin["fetchDidFail" /* FETCH_DID_FAIL */].call(plugin, {
                error,
                event,
                originalRequest: originalRequest.clone(),
                request: pluginFilteredRequest.clone(),
            });
        }
        throw error;
    }
};
const fetchWrapper = {
    fetch: wrappedFetch,
};

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Allows developers to copy a response and modify its `headers`, `status`,
 * or `statusText` values (the values settable via a
 * [`ResponseInit`]{@link https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#Syntax}
 * object in the constructor).
 * To modify these values, pass a function as the second argument. That
 * function will be invoked with a single object with the response properties
 * `{headers, status, statusText}`. The return value of this function will
 * be used as the `ResponseInit` for the new `Response`. To change the values
 * either modify the passed parameter(s) and return it, or return a totally
 * new object.
 *
 * @param {Response} response
 * @param {Function} modifier
 * @memberof module:workbox-core
 */
async function copyResponse(response, modifier) {
    const clonedResponse = response.clone();
    // Create a fresh `ResponseInit` object by cloning the headers.
    const responseInit = {
        headers: new Headers(clonedResponse.headers),
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
    };
    // Apply any user modifications.
    const modifiedResponseInit = modifier ? modifier(responseInit) : responseInit;
    // Create the new response from the body stream and `ResponseInit`
    // modifications. Note: not all browsers support the Response.body stream,
    // so fall back to reading the entire body into memory as a blob.
    const body = canConstructResponseFromBodyStream() ?
        clonedResponse.body : await clonedResponse.blob();
    return new Response(body, modifiedResponseInit);
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Claim any currently available clients once the service worker
 * becomes active. This is normally used in conjunction with `skipWaiting()`.
 *
 * @memberof module:workbox-core
 */
function clientsClaim() {
    self.addEventListener('activate', () => self.clients.claim());
}

// @ts-ignore
try {
    self['workbox:expiration:5.1.4'] && _();
}
catch (e) { }

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const DB_NAME = 'workbox-expiration';
const OBJECT_STORE_NAME = 'cache-entries';
const normalizeURL = (unNormalizedUrl) => {
    const url = new URL(unNormalizedUrl, location.href);
    url.hash = '';
    return url.href;
};
/**
 * Returns the timestamp model.
 *
 * @private
 */
class CacheTimestampsModel {
    /**
     *
     * @param {string} cacheName
     *
     * @private
     */
    constructor(cacheName) {
        this._cacheName = cacheName;
        this._db = new DBWrapper(DB_NAME, 1, {
            onupgradeneeded: (event) => this._handleUpgrade(event),
        });
    }
    /**
     * Should perform an upgrade of indexedDB.
     *
     * @param {Event} event
     *
     * @private
     */
    _handleUpgrade(event) {
        const db = event.target.result;
        // TODO(philipwalton): EdgeHTML doesn't support arrays as a keyPath, so we
        // have to use the `id` keyPath here and create our own values (a
        // concatenation of `url + cacheName`) instead of simply using
        // `keyPath: ['url', 'cacheName']`, which is supported in other browsers.
        const objStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        // TODO(philipwalton): once we don't have to support EdgeHTML, we can
        // create a single index with the keyPath `['cacheName', 'timestamp']`
        // instead of doing both these indexes.
        objStore.createIndex('cacheName', 'cacheName', { unique: false });
        objStore.createIndex('timestamp', 'timestamp', { unique: false });
        // Previous versions of `workbox-expiration` used `this._cacheName`
        // as the IDBDatabase name.
        deleteDatabase(this._cacheName);
    }
    /**
     * @param {string} url
     * @param {number} timestamp
     *
     * @private
     */
    async setTimestamp(url, timestamp) {
        url = normalizeURL(url);
        const entry = {
            url,
            timestamp,
            cacheName: this._cacheName,
            // Creating an ID from the URL and cache name won't be necessary once
            // Edge switches to Chromium and all browsers we support work with
            // array keyPaths.
            id: this._getId(url),
        };
        await this._db.put(OBJECT_STORE_NAME, entry);
    }
    /**
     * Returns the timestamp stored for a given URL.
     *
     * @param {string} url
     * @return {number}
     *
     * @private
     */
    async getTimestamp(url) {
        const entry = await this._db.get(OBJECT_STORE_NAME, this._getId(url));
        return entry.timestamp;
    }
    /**
     * Iterates through all the entries in the object store (from newest to
     * oldest) and removes entries once either `maxCount` is reached or the
     * entry's timestamp is less than `minTimestamp`.
     *
     * @param {number} minTimestamp
     * @param {number} maxCount
     * @return {Array<string>}
     *
     * @private
     */
    async expireEntries(minTimestamp, maxCount) {
        const entriesToDelete = await this._db.transaction(OBJECT_STORE_NAME, 'readwrite', (txn, done) => {
            const store = txn.objectStore(OBJECT_STORE_NAME);
            const request = store.index('timestamp').openCursor(null, 'prev');
            const entriesToDelete = [];
            let entriesNotDeletedCount = 0;
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const result = cursor.value;
                    // TODO(philipwalton): once we can use a multi-key index, we
                    // won't have to check `cacheName` here.
                    if (result.cacheName === this._cacheName) {
                        // Delete an entry if it's older than the max age or
                        // if we already have the max number allowed.
                        if ((minTimestamp && result.timestamp < minTimestamp) ||
                            (maxCount && entriesNotDeletedCount >= maxCount)) {
                            // TODO(philipwalton): we should be able to delete the
                            // entry right here, but doing so causes an iteration
                            // bug in Safari stable (fixed in TP). Instead we can
                            // store the keys of the entries to delete, and then
                            // delete the separate transactions.
                            // https://github.com/GoogleChrome/workbox/issues/1978
                            // cursor.delete();
                            // We only need to return the URL, not the whole entry.
                            entriesToDelete.push(cursor.value);
                        }
                        else {
                            entriesNotDeletedCount++;
                        }
                    }
                    cursor.continue();
                }
                else {
                    done(entriesToDelete);
                }
            };
        });
        // TODO(philipwalton): once the Safari bug in the following issue is fixed,
        // we should be able to remove this loop and do the entry deletion in the
        // cursor loop above:
        // https://github.com/GoogleChrome/workbox/issues/1978
        const urlsDeleted = [];
        for (const entry of entriesToDelete) {
            await this._db.delete(OBJECT_STORE_NAME, entry.id);
            urlsDeleted.push(entry.url);
        }
        return urlsDeleted;
    }
    /**
     * Takes a URL and returns an ID that will be unique in the object store.
     *
     * @param {string} url
     * @return {string}
     *
     * @private
     */
    _getId(url) {
        // Creating an ID from the URL and cache name won't be necessary once
        // Edge switches to Chromium and all browsers we support work with
        // array keyPaths.
        return this._cacheName + '|' + normalizeURL(url);
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * The `CacheExpiration` class allows you define an expiration and / or
 * limit on the number of responses stored in a
 * [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
 *
 * @memberof module:workbox-expiration
 */
class CacheExpiration {
    /**
     * To construct a new CacheExpiration instance you must provide at least
     * one of the `config` properties.
     *
     * @param {string} cacheName Name of the cache to apply restrictions to.
     * @param {Object} config
     * @param {number} [config.maxEntries] The maximum number of entries to cache.
     * Entries used the least will be removed as the maximum is reached.
     * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
     * it's treated as stale and removed.
     */
    constructor(cacheName, config = {}) {
        this._isRunning = false;
        this._rerunRequested = false;
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isType(cacheName, 'string', {
                moduleName: 'workbox-expiration',
                className: 'CacheExpiration',
                funcName: 'constructor',
                paramName: 'cacheName',
            });
            if (!(config.maxEntries || config.maxAgeSeconds)) {
                throw new WorkboxError('max-entries-or-age-required', {
                    moduleName: 'workbox-expiration',
                    className: 'CacheExpiration',
                    funcName: 'constructor',
                });
            }
            if (config.maxEntries) {
                finalAssertExports.isType(config.maxEntries, 'number', {
                    moduleName: 'workbox-expiration',
                    className: 'CacheExpiration',
                    funcName: 'constructor',
                    paramName: 'config.maxEntries',
                });
                // TODO: Assert is positive
            }
            if (config.maxAgeSeconds) {
                finalAssertExports.isType(config.maxAgeSeconds, 'number', {
                    moduleName: 'workbox-expiration',
                    className: 'CacheExpiration',
                    funcName: 'constructor',
                    paramName: 'config.maxAgeSeconds',
                });
                // TODO: Assert is positive
            }
        }
        this._maxEntries = config.maxEntries;
        this._maxAgeSeconds = config.maxAgeSeconds;
        this._cacheName = cacheName;
        this._timestampModel = new CacheTimestampsModel(cacheName);
    }
    /**
     * Expires entries for the given cache and given criteria.
     */
    async expireEntries() {
        if (this._isRunning) {
            this._rerunRequested = true;
            return;
        }
        this._isRunning = true;
        const minTimestamp = this._maxAgeSeconds ?
            Date.now() - (this._maxAgeSeconds * 1000) : 0;
        const urlsExpired = await this._timestampModel.expireEntries(minTimestamp, this._maxEntries);
        // Delete URLs from the cache
        const cache = await self.caches.open(this._cacheName);
        for (const url of urlsExpired) {
            await cache.delete(url);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (urlsExpired.length > 0) {
                logger.groupCollapsed(`Expired ${urlsExpired.length} ` +
                    `${urlsExpired.length === 1 ? 'entry' : 'entries'} and removed ` +
                    `${urlsExpired.length === 1 ? 'it' : 'them'} from the ` +
                    `'${this._cacheName}' cache.`);
                logger.log(`Expired the following ${urlsExpired.length === 1 ?
                    'URL' : 'URLs'}:`);
                urlsExpired.forEach((url) => logger.log(`    ${url}`));
                logger.groupEnd();
            }
            else {
                logger.debug(`Cache expiration ran and found no entries to remove.`);
            }
        }
        this._isRunning = false;
        if (this._rerunRequested) {
            this._rerunRequested = false;
            dontWaitFor(this.expireEntries());
        }
    }
    /**
     * Update the timestamp for the given URL. This ensures the when
     * removing entries based on maximum entries, most recently used
     * is accurate or when expiring, the timestamp is up-to-date.
     *
     * @param {string} url
     */
    async updateTimestamp(url) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isType(url, 'string', {
                moduleName: 'workbox-expiration',
                className: 'CacheExpiration',
                funcName: 'updateTimestamp',
                paramName: 'url',
            });
        }
        await this._timestampModel.setTimestamp(url, Date.now());
    }
    /**
     * Can be used to check if a URL has expired or not before it's used.
     *
     * This requires a look up from IndexedDB, so can be slow.
     *
     * Note: This method will not remove the cached entry, call
     * `expireEntries()` to remove indexedDB and Cache entries.
     *
     * @param {string} url
     * @return {boolean}
     */
    async isURLExpired(url) {
        if (!this._maxAgeSeconds) {
            if (process.env.NODE_ENV !== 'production') {
                throw new WorkboxError(`expired-test-without-max-age`, {
                    methodName: 'isURLExpired',
                    paramName: 'maxAgeSeconds',
                });
            }
            return false;
        }
        else {
            const timestamp = await this._timestampModel.getTimestamp(url);
            const expireOlderThan = Date.now() - (this._maxAgeSeconds * 1000);
            return (timestamp < expireOlderThan);
        }
    }
    /**
     * Removes the IndexedDB object store used to keep track of cache expiration
     * metadata.
     */
    async delete() {
        // Make sure we don't attempt another rerun if we're called in the middle of
        // a cache expiration.
        this._rerunRequested = false;
        await this._timestampModel.expireEntries(Infinity); // Expires all.
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * This plugin can be used in the Workbox APIs to regularly enforce a
 * limit on the age and / or the number of cached requests.
 *
 * Whenever a cached request is used or updated, this plugin will look
 * at the used Cache and remove any old or extra requests.
 *
 * When using `maxAgeSeconds`, requests may be used *once* after expiring
 * because the expiration clean up will not have occurred until *after* the
 * cached request has been used. If the request has a "Date" header, then
 * a light weight expiration check is performed and the request will not be
 * used immediately.
 *
 * When using `maxEntries`, the entry least-recently requested will be removed
 * from the cache first.
 *
 * @memberof module:workbox-expiration
 */
class ExpirationPlugin {
    /**
     * @param {Object} config
     * @param {number} [config.maxEntries] The maximum number of entries to cache.
     * Entries used the least will be removed as the maximum is reached.
     * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
     * it's treated as stale and removed.
     * @param {boolean} [config.purgeOnQuotaError] Whether to opt this cache in to
     * automatic deletion if the available storage quota has been exceeded.
     */
    constructor(config = {}) {
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox-strategies` handlers when a `Response` is about to be returned
         * from a [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to
         * the handler. It allows the `Response` to be inspected for freshness and
         * prevents it from being used if the `Response`'s `Date` header value is
         * older than the configured `maxAgeSeconds`.
         *
         * @param {Object} options
         * @param {string} options.cacheName Name of the cache the response is in.
         * @param {Response} options.cachedResponse The `Response` object that's been
         *     read from a cache and whose freshness should be checked.
         * @return {Response} Either the `cachedResponse`, if it's
         *     fresh, or `null` if the `Response` is older than `maxAgeSeconds`.
         *
         * @private
         */
        this.cachedResponseWillBeUsed = async ({ event, request, cacheName, cachedResponse }) => {
            if (!cachedResponse) {
                return null;
            }
            const isFresh = this._isResponseDateFresh(cachedResponse);
            // Expire entries to ensure that even if the expiration date has
            // expired, it'll only be used once.
            const cacheExpiration = this._getCacheExpiration(cacheName);
            dontWaitFor(cacheExpiration.expireEntries());
            // Update the metadata for the request URL to the current timestamp,
            // but don't `await` it as we don't want to block the response.
            const updateTimestampDone = cacheExpiration.updateTimestamp(request.url);
            if (event) {
                try {
                    event.waitUntil(updateTimestampDone);
                }
                catch (error) {
                    if (process.env.NODE_ENV !== 'production') {
                        // The event may not be a fetch event; only log the URL if it is.
                        if ('request' in event) {
                            logger.warn(`Unable to ensure service worker stays alive when ` +
                                `updating cache entry for ` +
                                `'${getFriendlyURL(event.request.url)}'.`);
                        }
                    }
                }
            }
            return isFresh ? cachedResponse : null;
        };
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox-strategies` handlers when an entry is added to a cache.
         *
         * @param {Object} options
         * @param {string} options.cacheName Name of the cache that was updated.
         * @param {string} options.request The Request for the cached entry.
         *
         * @private
         */
        this.cacheDidUpdate = async ({ cacheName, request }) => {
            if (process.env.NODE_ENV !== 'production') {
                finalAssertExports.isType(cacheName, 'string', {
                    moduleName: 'workbox-expiration',
                    className: 'Plugin',
                    funcName: 'cacheDidUpdate',
                    paramName: 'cacheName',
                });
                finalAssertExports.isInstance(request, Request, {
                    moduleName: 'workbox-expiration',
                    className: 'Plugin',
                    funcName: 'cacheDidUpdate',
                    paramName: 'request',
                });
            }
            const cacheExpiration = this._getCacheExpiration(cacheName);
            await cacheExpiration.updateTimestamp(request.url);
            await cacheExpiration.expireEntries();
        };
        if (process.env.NODE_ENV !== 'production') {
            if (!(config.maxEntries || config.maxAgeSeconds)) {
                throw new WorkboxError('max-entries-or-age-required', {
                    moduleName: 'workbox-expiration',
                    className: 'Plugin',
                    funcName: 'constructor',
                });
            }
            if (config.maxEntries) {
                finalAssertExports.isType(config.maxEntries, 'number', {
                    moduleName: 'workbox-expiration',
                    className: 'Plugin',
                    funcName: 'constructor',
                    paramName: 'config.maxEntries',
                });
            }
            if (config.maxAgeSeconds) {
                finalAssertExports.isType(config.maxAgeSeconds, 'number', {
                    moduleName: 'workbox-expiration',
                    className: 'Plugin',
                    funcName: 'constructor',
                    paramName: 'config.maxAgeSeconds',
                });
            }
        }
        this._config = config;
        this._maxAgeSeconds = config.maxAgeSeconds;
        this._cacheExpirations = new Map();
        if (config.purgeOnQuotaError) {
            registerQuotaErrorCallback(() => this.deleteCacheAndMetadata());
        }
    }
    /**
     * A simple helper method to return a CacheExpiration instance for a given
     * cache name.
     *
     * @param {string} cacheName
     * @return {CacheExpiration}
     *
     * @private
     */
    _getCacheExpiration(cacheName) {
        if (cacheName === cacheNames.getRuntimeName()) {
            throw new WorkboxError('expire-custom-caches-only');
        }
        let cacheExpiration = this._cacheExpirations.get(cacheName);
        if (!cacheExpiration) {
            cacheExpiration = new CacheExpiration(cacheName, this._config);
            this._cacheExpirations.set(cacheName, cacheExpiration);
        }
        return cacheExpiration;
    }
    /**
     * @param {Response} cachedResponse
     * @return {boolean}
     *
     * @private
     */
    _isResponseDateFresh(cachedResponse) {
        if (!this._maxAgeSeconds) {
            // We aren't expiring by age, so return true, it's fresh
            return true;
        }
        // Check if the 'date' header will suffice a quick expiration check.
        // See https://github.com/GoogleChromeLabs/sw-toolbox/issues/164 for
        // discussion.
        const dateHeaderTimestamp = this._getDateHeaderTimestamp(cachedResponse);
        if (dateHeaderTimestamp === null) {
            // Unable to parse date, so assume it's fresh.
            return true;
        }
        // If we have a valid headerTime, then our response is fresh iff the
        // headerTime plus maxAgeSeconds is greater than the current time.
        const now = Date.now();
        return dateHeaderTimestamp >= now - (this._maxAgeSeconds * 1000);
    }
    /**
     * This method will extract the data header and parse it into a useful
     * value.
     *
     * @param {Response} cachedResponse
     * @return {number|null}
     *
     * @private
     */
    _getDateHeaderTimestamp(cachedResponse) {
        if (!cachedResponse.headers.has('date')) {
            return null;
        }
        const dateHeader = cachedResponse.headers.get('date');
        const parsedDate = new Date(dateHeader);
        const headerTime = parsedDate.getTime();
        // If the Date header was invalid for some reason, parsedDate.getTime()
        // will return NaN.
        if (isNaN(headerTime)) {
            return null;
        }
        return headerTime;
    }
    /**
     * This is a helper method that performs two operations:
     *
     * - Deletes *all* the underlying Cache instances associated with this plugin
     * instance, by calling caches.delete() on your behalf.
     * - Deletes the metadata from IndexedDB used to keep track of expiration
     * details for each Cache instance.
     *
     * When using cache expiration, calling this method is preferable to calling
     * `caches.delete()` directly, since this will ensure that the IndexedDB
     * metadata is also cleanly removed and open IndexedDB instances are deleted.
     *
     * Note that if you're *not* using cache expiration for a given cache, calling
     * `caches.delete()` and passing in the cache's name should be sufficient.
     * There is no Workbox-specific method needed for cleanup in that case.
     */
    async deleteCacheAndMetadata() {
        // Do this one at a time instead of all at once via `Promise.all()` to
        // reduce the chance of inconsistency if a promise rejects.
        for (const [cacheName, cacheExpiration] of this._cacheExpirations) {
            await self.caches.delete(cacheName);
            await cacheExpiration.delete();
        }
        // Reset this._cacheExpirations to its initial state.
        this._cacheExpirations = new Map();
    }
}

// @ts-ignore
try {
    self['workbox:precaching:5.1.4'] && _();
}
catch (e) { }

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const plugins = [];
const precachePlugins = {
    /*
     * @return {Array}
     * @private
     */
    get() {
        return plugins;
    },
    /*
     * @param {Array} newPlugins
     * @private
     */
    add(newPlugins) {
        plugins.push(...newPlugins);
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
// Name of the search parameter used to store revision info.
const REVISION_SEARCH_PARAM = '__WB_REVISION__';
/**
 * Converts a manifest entry into a versioned URL suitable for precaching.
 *
 * @param {Object|string} entry
 * @return {string} A URL with versioning info.
 *
 * @private
 * @memberof module:workbox-precaching
 */
function createCacheKey(entry) {
    if (!entry) {
        throw new WorkboxError('add-to-cache-list-unexpected-type', { entry });
    }
    // If a precache manifest entry is a string, it's assumed to be a versioned
    // URL, like '/app.abcd1234.js'. Return as-is.
    if (typeof entry === 'string') {
        const urlObject = new URL(entry, location.href);
        return {
            cacheKey: urlObject.href,
            url: urlObject.href,
        };
    }
    const { revision, url } = entry;
    if (!url) {
        throw new WorkboxError('add-to-cache-list-unexpected-type', { entry });
    }
    // If there's just a URL and no revision, then it's also assumed to be a
    // versioned URL.
    if (!revision) {
        const urlObject = new URL(url, location.href);
        return {
            cacheKey: urlObject.href,
            url: urlObject.href,
        };
    }
    // Otherwise, construct a properly versioned URL using the custom Workbox
    // search parameter along with the revision info.
    const cacheKeyURL = new URL(url, location.href);
    const originalURL = new URL(url, location.href);
    cacheKeyURL.searchParams.set(REVISION_SEARCH_PARAM, revision);
    return {
        cacheKey: cacheKeyURL.href,
        url: originalURL.href,
    };
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * @param {string} groupTitle
 * @param {Array<string>} deletedURLs
 *
 * @private
 */
const logGroup = (groupTitle, deletedURLs) => {
    logger.groupCollapsed(groupTitle);
    for (const url of deletedURLs) {
        logger.log(url);
    }
    logger.groupEnd();
};
/**
 * @param {Array<string>} deletedURLs
 *
 * @private
 * @memberof module:workbox-precaching
 */
function printCleanupDetails(deletedURLs) {
    const deletionCount = deletedURLs.length;
    if (deletionCount > 0) {
        logger.groupCollapsed(`During precaching cleanup, ` +
            `${deletionCount} cached ` +
            `request${deletionCount === 1 ? ' was' : 's were'} deleted.`);
        logGroup('Deleted Cache Requests', deletedURLs);
        logger.groupEnd();
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * @param {string} groupTitle
 * @param {Array<string>} urls
 *
 * @private
 */
function _nestedGroup(groupTitle, urls) {
    if (urls.length === 0) {
        return;
    }
    logger.groupCollapsed(groupTitle);
    for (const url of urls) {
        logger.log(url);
    }
    logger.groupEnd();
}
/**
 * @param {Array<string>} urlsToPrecache
 * @param {Array<string>} urlsAlreadyPrecached
 *
 * @private
 * @memberof module:workbox-precaching
 */
function printInstallDetails(urlsToPrecache, urlsAlreadyPrecached) {
    const precachedCount = urlsToPrecache.length;
    const alreadyPrecachedCount = urlsAlreadyPrecached.length;
    if (precachedCount || alreadyPrecachedCount) {
        let message = `Precaching ${precachedCount} file${precachedCount === 1 ? '' : 's'}.`;
        if (alreadyPrecachedCount > 0) {
            message += ` ${alreadyPrecachedCount} ` +
                `file${alreadyPrecachedCount === 1 ? ' is' : 's are'} already cached.`;
        }
        logger.groupCollapsed(message);
        _nestedGroup(`View newly precached URLs.`, urlsToPrecache);
        _nestedGroup(`View previously precached URLs.`, urlsAlreadyPrecached);
        logger.groupEnd();
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Performs efficient precaching of assets.
 *
 * @memberof module:workbox-precaching
 */
class PrecacheController {
    /**
     * Create a new PrecacheController.
     *
     * @param {string} [cacheName] An optional name for the cache, to override
     * the default precache name.
     */
    constructor(cacheName) {
        this._cacheName = cacheNames.getPrecacheName(cacheName);
        this._urlsToCacheKeys = new Map();
        this._urlsToCacheModes = new Map();
        this._cacheKeysToIntegrities = new Map();
    }
    /**
     * This method will add items to the precache list, removing duplicates
     * and ensuring the information is valid.
     *
     * @param {
     * Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>
     * } entries Array of entries to precache.
     */
    addToCacheList(entries) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isArray(entries, {
                moduleName: 'workbox-precaching',
                className: 'PrecacheController',
                funcName: 'addToCacheList',
                paramName: 'entries',
            });
        }
        const urlsToWarnAbout = [];
        for (const entry of entries) {
            // See https://github.com/GoogleChrome/workbox/issues/2259
            if (typeof entry === 'string') {
                urlsToWarnAbout.push(entry);
            }
            else if (entry && entry.revision === undefined) {
                urlsToWarnAbout.push(entry.url);
            }
            const { cacheKey, url } = createCacheKey(entry);
            const cacheMode = (typeof entry !== 'string' && entry.revision) ?
                'reload' : 'default';
            if (this._urlsToCacheKeys.has(url) &&
                this._urlsToCacheKeys.get(url) !== cacheKey) {
                throw new WorkboxError('add-to-cache-list-conflicting-entries', {
                    firstEntry: this._urlsToCacheKeys.get(url),
                    secondEntry: cacheKey,
                });
            }
            if (typeof entry !== 'string' && entry.integrity) {
                if (this._cacheKeysToIntegrities.has(cacheKey) &&
                    this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
                    throw new WorkboxError('add-to-cache-list-conflicting-integrities', {
                        url,
                    });
                }
                this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
            }
            this._urlsToCacheKeys.set(url, cacheKey);
            this._urlsToCacheModes.set(url, cacheMode);
            if (urlsToWarnAbout.length > 0) {
                const warningMessage = `Workbox is precaching URLs without revision ` +
                    `info: ${urlsToWarnAbout.join(', ')}\nThis is generally NOT safe. ` +
                    `Learn more at https://bit.ly/wb-precache`;
                if (process.env.NODE_ENV === 'production') {
                    // Use console directly to display this warning without bloating
                    // bundle sizes by pulling in all of the logger codebase in prod.
                    console.warn(warningMessage);
                }
                else {
                    logger.warn(warningMessage);
                }
            }
        }
    }
    /**
     * Precaches new and updated assets. Call this method from the service worker
     * install event.
     *
     * @param {Object} options
     * @param {Event} [options.event] The install event (if needed).
     * @param {Array<Object>} [options.plugins] Plugins to be used for fetching
     * and caching during install.
     * @return {Promise<module:workbox-precaching.InstallResult>}
     */
    async install({ event, plugins } = {}) {
        if (process.env.NODE_ENV !== 'production') {
            if (plugins) {
                finalAssertExports.isArray(plugins, {
                    moduleName: 'workbox-precaching',
                    className: 'PrecacheController',
                    funcName: 'install',
                    paramName: 'plugins',
                });
            }
        }
        const toBePrecached = [];
        const alreadyPrecached = [];
        const cache = await self.caches.open(this._cacheName);
        const alreadyCachedRequests = await cache.keys();
        const existingCacheKeys = new Set(alreadyCachedRequests.map((request) => request.url));
        for (const [url, cacheKey] of this._urlsToCacheKeys) {
            if (existingCacheKeys.has(cacheKey)) {
                alreadyPrecached.push(url);
            }
            else {
                toBePrecached.push({ cacheKey, url });
            }
        }
        const precacheRequests = toBePrecached.map(({ cacheKey, url }) => {
            const integrity = this._cacheKeysToIntegrities.get(cacheKey);
            const cacheMode = this._urlsToCacheModes.get(url);
            return this._addURLToCache({
                cacheKey,
                cacheMode,
                event,
                integrity,
                plugins,
                url,
            });
        });
        await Promise.all(precacheRequests);
        const updatedURLs = toBePrecached.map((item) => item.url);
        if (process.env.NODE_ENV !== 'production') {
            printInstallDetails(updatedURLs, alreadyPrecached);
        }
        return {
            updatedURLs,
            notUpdatedURLs: alreadyPrecached,
        };
    }
    /**
     * Deletes assets that are no longer present in the current precache manifest.
     * Call this method from the service worker activate event.
     *
     * @return {Promise<module:workbox-precaching.CleanupResult>}
     */
    async activate() {
        const cache = await self.caches.open(this._cacheName);
        const currentlyCachedRequests = await cache.keys();
        const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());
        const deletedURLs = [];
        for (const request of currentlyCachedRequests) {
            if (!expectedCacheKeys.has(request.url)) {
                await cache.delete(request);
                deletedURLs.push(request.url);
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            printCleanupDetails(deletedURLs);
        }
        return { deletedURLs };
    }
    /**
     * Requests the entry and saves it to the cache if the response is valid.
     * By default, any response with a status code of less than 400 (including
     * opaque responses) is considered valid.
     *
     * If you need to use custom criteria to determine what's valid and what
     * isn't, then pass in an item in `options.plugins` that implements the
     * `cacheWillUpdate()` lifecycle event.
     *
     * @private
     * @param {Object} options
     * @param {string} options.cacheKey The string to use a cache key.
     * @param {string} options.url The URL to fetch and cache.
     * @param {string} [options.cacheMode] The cache mode for the network request.
     * @param {Event} [options.event] The install event (if passed).
     * @param {Array<Object>} [options.plugins] An array of plugins to apply to
     * fetch and caching.
     * @param {string} [options.integrity] The value to use for the `integrity`
     * field when making the request.
     */
    async _addURLToCache({ cacheKey, url, cacheMode, event, plugins, integrity }) {
        const request = new Request(url, {
            integrity,
            cache: cacheMode,
            credentials: 'same-origin',
        });
        let response = await fetchWrapper.fetch({
            event,
            plugins,
            request,
        });
        // Allow developers to override the default logic about what is and isn't
        // valid by passing in a plugin implementing cacheWillUpdate(), e.g.
        // a `CacheableResponsePlugin` instance.
        let cacheWillUpdatePlugin;
        for (const plugin of (plugins || [])) {
            if ('cacheWillUpdate' in plugin) {
                cacheWillUpdatePlugin = plugin;
            }
        }
        const isValidResponse = cacheWillUpdatePlugin ?
            // Use a callback if provided. It returns a truthy value if valid.
            // NOTE: invoke the method on the plugin instance so the `this` context
            // is correct.
            await cacheWillUpdatePlugin.cacheWillUpdate({ event, request, response }) :
            // Otherwise, default to considering any response status under 400 valid.
            // This includes, by default, considering opaque responses valid.
            response.status < 400;
        // Consider this a failure, leading to the `install` handler failing, if
        // we get back an invalid response.
        if (!isValidResponse) {
            throw new WorkboxError('bad-precaching-response', {
                url,
                status: response.status,
            });
        }
        // Redirected responses cannot be used to satisfy a navigation request, so
        // any redirected response must be "copied" rather than cloned, so the new
        // response doesn't contain the `redirected` flag. See:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1
        if (response.redirected) {
            response = await copyResponse(response);
        }
        await cacheWrapper.put({
            event,
            plugins,
            response,
            // `request` already uses `url`. We may be able to reuse it.
            request: cacheKey === url ? request : new Request(cacheKey),
            cacheName: this._cacheName,
            matchOptions: {
                ignoreSearch: true,
            },
        });
    }
    /**
     * Returns a mapping of a precached URL to the corresponding cache key, taking
     * into account the revision information for the URL.
     *
     * @return {Map<string, string>} A URL to cache key mapping.
     */
    getURLsToCacheKeys() {
        return this._urlsToCacheKeys;
    }
    /**
     * Returns a list of all the URLs that have been precached by the current
     * service worker.
     *
     * @return {Array<string>} The precached URLs.
     */
    getCachedURLs() {
        return [...this._urlsToCacheKeys.keys()];
    }
    /**
     * Returns the cache key used for storing a given URL. If that URL is
     * unversioned, like `/index.html', then the cache key will be the original
     * URL with a search parameter appended to it.
     *
     * @param {string} url A URL whose cache key you want to look up.
     * @return {string} The versioned URL that corresponds to a cache key
     * for the original URL, or undefined if that URL isn't precached.
     */
    getCacheKeyForURL(url) {
        const urlObject = new URL(url, location.href);
        return this._urlsToCacheKeys.get(urlObject.href);
    }
    /**
     * This acts as a drop-in replacement for [`cache.match()`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match)
     * with the following differences:
     *
     * - It knows what the name of the precache is, and only checks in that cache.
     * - It allows you to pass in an "original" URL without versioning parameters,
     * and it will automatically look up the correct cache key for the currently
     * active revision of that URL.
     *
     * E.g., `matchPrecache('index.html')` will find the correct precached
     * response for the currently active service worker, even if the actual cache
     * key is `'/index.html?__WB_REVISION__=1234abcd'`.
     *
     * @param {string|Request} request The key (without revisioning parameters)
     * to look up in the precache.
     * @return {Promise<Response|undefined>}
     */
    async matchPrecache(request) {
        const url = request instanceof Request ? request.url : request;
        const cacheKey = this.getCacheKeyForURL(url);
        if (cacheKey) {
            const cache = await self.caches.open(this._cacheName);
            return cache.match(cacheKey);
        }
        return undefined;
    }
    /**
     * Returns a function that can be used within a
     * {@link module:workbox-routing.Route} that will find a response for the
     * incoming request against the precache.
     *
     * If for an unexpected reason there is a cache miss for the request,
     * this will fall back to retrieving the `Response` via `fetch()` when
     * `fallbackToNetwork` is `true`.
     *
     * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
     * response from the network if there's a precache miss.
     * @return {module:workbox-routing~handlerCallback}
     */
    createHandler(fallbackToNetwork = true) {
        return async ({ request }) => {
            try {
                const response = await this.matchPrecache(request);
                if (response) {
                    return response;
                }
                // This shouldn't normally happen, but there are edge cases:
                // https://github.com/GoogleChrome/workbox/issues/1441
                throw new WorkboxError('missing-precache-entry', {
                    cacheName: this._cacheName,
                    url: request instanceof Request ? request.url : request,
                });
            }
            catch (error) {
                if (fallbackToNetwork) {
                    if (process.env.NODE_ENV !== 'production') {
                        logger.debug(`Unable to respond with precached response. ` +
                            `Falling back to network.`, error);
                    }
                    return fetch(request);
                }
                throw error;
            }
        };
    }
    /**
     * Returns a function that looks up `url` in the precache (taking into
     * account revision information), and returns the corresponding `Response`.
     *
     * If for an unexpected reason there is a cache miss when looking up `url`,
     * this will fall back to retrieving the `Response` via `fetch()` when
     * `fallbackToNetwork` is `true`.
     *
     * @param {string} url The precached URL which will be used to lookup the
     * `Response`.
     * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
     * response from the network if there's a precache miss.
     * @return {module:workbox-routing~handlerCallback}
     */
    createHandlerBoundToURL(url, fallbackToNetwork = true) {
        const cacheKey = this.getCacheKeyForURL(url);
        if (!cacheKey) {
            throw new WorkboxError('non-precached-url', { url });
        }
        const handler = this.createHandler(fallbackToNetwork);
        const request = new Request(url);
        return () => handler({ request });
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
let precacheController;
/**
 * @return {PrecacheController}
 * @private
 */
const getOrCreatePrecacheController = () => {
    if (!precacheController) {
        precacheController = new PrecacheController();
    }
    return precacheController;
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Removes any URL search parameters that should be ignored.
 *
 * @param {URL} urlObject The original URL.
 * @param {Array<RegExp>} ignoreURLParametersMatching RegExps to test against
 * each search parameter name. Matches mean that the search parameter should be
 * ignored.
 * @return {URL} The URL with any ignored search parameters removed.
 *
 * @private
 * @memberof module:workbox-precaching
 */
function removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching = []) {
    // Convert the iterable into an array at the start of the loop to make sure
    // deletion doesn't mess up iteration.
    for (const paramName of [...urlObject.searchParams.keys()]) {
        if (ignoreURLParametersMatching.some((regExp) => regExp.test(paramName))) {
            urlObject.searchParams.delete(paramName);
        }
    }
    return urlObject;
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Generator function that yields possible variations on the original URL to
 * check, one at a time.
 *
 * @param {string} url
 * @param {Object} options
 *
 * @private
 * @memberof module:workbox-precaching
 */
function* generateURLVariations(url, { ignoreURLParametersMatching, directoryIndex, cleanURLs, urlManipulation, } = {}) {
    const urlObject = new URL(url, location.href);
    urlObject.hash = '';
    yield urlObject.href;
    const urlWithoutIgnoredParams = removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching);
    yield urlWithoutIgnoredParams.href;
    if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith('/')) {
        const directoryURL = new URL(urlWithoutIgnoredParams.href);
        directoryURL.pathname += directoryIndex;
        yield directoryURL.href;
    }
    if (cleanURLs) {
        const cleanURL = new URL(urlWithoutIgnoredParams.href);
        cleanURL.pathname += '.html';
        yield cleanURL.href;
    }
    if (urlManipulation) {
        const additionalURLs = urlManipulation({ url: urlObject });
        for (const urlToAttempt of additionalURLs) {
            yield urlToAttempt.href;
        }
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * This function will take the request URL and manipulate it based on the
 * configuration options.
 *
 * @param {string} url
 * @param {Object} options
 * @return {string} Returns the URL in the cache that matches the request,
 * if possible.
 *
 * @private
 */
const getCacheKeyForURL = (url, options) => {
    const precacheController = getOrCreatePrecacheController();
    const urlsToCacheKeys = precacheController.getURLsToCacheKeys();
    for (const possibleURL of generateURLVariations(url, options)) {
        const possibleCacheKey = urlsToCacheKeys.get(possibleURL);
        if (possibleCacheKey) {
            return possibleCacheKey;
        }
    }
};

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Adds a `fetch` listener to the service worker that will
 * respond to
 * [network requests]{@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Custom_responses_to_requests}
 * with precached assets.
 *
 * Requests for assets that aren't precached, the `FetchEvent` will not be
 * responded to, allowing the event to fall through to other `fetch` event
 * listeners.
 *
 * NOTE: when called more than once this method will replace the previously set
 * configuration options. Calling it more than once is not recommended outside
 * of tests.
 *
 * @private
 * @param {Object} [options]
 * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
 * check cache entries for a URLs ending with '/' to see if there is a hit when
 * appending the `directoryIndex` value.
 * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/]] An
 * array of regex's to remove search params when looking for a cache match.
 * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
 * check the cache for the URL with a `.html` added to the end of the end.
 * @param {workbox.precaching~urlManipulation} [options.urlManipulation]
 * This is a function that should take a URL and return an array of
 * alternative URLs that should be checked for precache matches.
 */
const addFetchListener = ({ ignoreURLParametersMatching = [/^utm_/], directoryIndex = 'index.html', cleanURLs = true, urlManipulation, } = {}) => {
    const cacheName = cacheNames.getPrecacheName();
    // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
    self.addEventListener('fetch', ((event) => {
        const precachedURL = getCacheKeyForURL(event.request.url, {
            cleanURLs,
            directoryIndex,
            ignoreURLParametersMatching,
            urlManipulation,
        });
        if (!precachedURL) {
            if (process.env.NODE_ENV !== 'production') {
                logger.debug(`Precaching did not find a match for ` +
                    getFriendlyURL(event.request.url));
            }
            return;
        }
        let responsePromise = self.caches.open(cacheName).then((cache) => {
            return cache.match(precachedURL);
        }).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            // Fall back to the network if we don't have a cached response
            // (perhaps due to manual cache cleanup).
            if (process.env.NODE_ENV !== 'production') {
                logger.warn(`The precached response for ` +
                    `${getFriendlyURL(precachedURL)} in ${cacheName} was not found. ` +
                    `Falling back to the network instead.`);
            }
            return fetch(precachedURL);
        });
        if (process.env.NODE_ENV !== 'production') {
            responsePromise = responsePromise.then((response) => {
                // Workbox is going to handle the route.
                // print the routing details to the console.
                logger.groupCollapsed(`Precaching is responding to: ` +
                    getFriendlyURL(event.request.url));
                logger.log(`Serving the precached url: ${precachedURL}`);
                logger.groupCollapsed(`View request details here.`);
                logger.log(event.request);
                logger.groupEnd();
                logger.groupCollapsed(`View response details here.`);
                logger.log(response);
                logger.groupEnd();
                logger.groupEnd();
                return response;
            });
        }
        event.respondWith(responsePromise);
    }));
};

/*
  Copyright 2019 Google LLC
  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
let listenerAdded = false;
/**
 * Add a `fetch` listener to the service worker that will
 * respond to
 * [network requests]{@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Custom_responses_to_requests}
 * with precached assets.
 *
 * Requests for assets that aren't precached, the `FetchEvent` will not be
 * responded to, allowing the event to fall through to other `fetch` event
 * listeners.
 *
 * @param {Object} [options]
 * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
 * check cache entries for a URLs ending with '/' to see if there is a hit when
 * appending the `directoryIndex` value.
 * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/]] An
 * array of regex's to remove search params when looking for a cache match.
 * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
 * check the cache for the URL with a `.html` added to the end of the end.
 * @param {module:workbox-precaching~urlManipulation} [options.urlManipulation]
 * This is a function that should take a URL and return an array of
 * alternative URLs that should be checked for precache matches.
 *
 * @memberof module:workbox-precaching
 */
function addRoute(options) {
    if (!listenerAdded) {
        addFetchListener(options);
        listenerAdded = true;
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Helper function that calls
 * {@link PrecacheController#createHandlerBoundToURL} on the default
 * {@link PrecacheController} instance.
 *
 * If you are creating your own {@link PrecacheController}, then call the
 * {@link PrecacheController#createHandlerBoundToURL} on that instance,
 * instead of using this function.
 *
 * @param {string} url The precached URL which will be used to lookup the
 * `Response`.
 * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
 * response from the network if there's a precache miss.
 * @return {module:workbox-routing~handlerCallback}
 *
 * @memberof module:workbox-precaching
 */
function createHandlerBoundToURL(url) {
    const precacheController = getOrCreatePrecacheController();
    return precacheController.createHandlerBoundToURL(url);
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const installListener = (event) => {
    const precacheController = getOrCreatePrecacheController();
    const plugins = precachePlugins.get();
    event.waitUntil(precacheController.install({ event, plugins })
        .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
            logger.error(`Service worker installation failed. It will ` +
                `be retried automatically during the next navigation.`);
        }
        // Re-throw the error to ensure installation fails.
        throw error;
    }));
};
const activateListener = (event) => {
    const precacheController = getOrCreatePrecacheController();
    event.waitUntil(precacheController.activate());
};
/**
 * Adds items to the precache list, removing any duplicates and
 * stores the files in the
 * ["precache cache"]{@link module:workbox-core.cacheNames} when the service
 * worker installs.
 *
 * This method can be called multiple times.
 *
 * Please note: This method **will not** serve any of the cached files for you.
 * It only precaches files. To respond to a network request you call
 * [addRoute()]{@link module:workbox-precaching.addRoute}.
 *
 * If you have a single array of files to precache, you can just call
 * [precacheAndRoute()]{@link module:workbox-precaching.precacheAndRoute}.
 *
 * @param {Array<Object|string>} [entries=[]] Array of entries to precache.
 *
 * @memberof module:workbox-precaching
 */
function precache(entries) {
    const precacheController = getOrCreatePrecacheController();
    precacheController.addToCacheList(entries);
    if (entries.length > 0) {
        // NOTE: these listeners will only be added once (even if the `precache()`
        // method is called multiple times) because event listeners are implemented
        // as a set, where each listener must be unique.
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('install', installListener);
        self.addEventListener('activate', activateListener);
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * This method will add entries to the precache list and add a route to
 * respond to fetch events.
 *
 * This is a convenience method that will call
 * [precache()]{@link module:workbox-precaching.precache} and
 * [addRoute()]{@link module:workbox-precaching.addRoute} in a single call.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 * @param {Object} [options] See
 * [addRoute() options]{@link module:workbox-precaching.addRoute}.
 *
 * @memberof module:workbox-precaching
 */
function precacheAndRoute(entries, options) {
    precache(entries);
    addRoute(options);
}

// @ts-ignore
try {
    self['workbox:routing:5.1.4'] && _();
}
catch (e) { }

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * The default HTTP method, 'GET', used when there's no specific method
 * configured for a route.
 *
 * @type {string}
 *
 * @private
 */
const defaultMethod = 'GET';
/**
 * The list of valid HTTP methods associated with requests that could be routed.
 *
 * @type {Array<string>}
 *
 * @private
 */
const validMethods = [
    'DELETE',
    'GET',
    'HEAD',
    'PATCH',
    'POST',
    'PUT',
];

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * @param {function()|Object} handler Either a function, or an object with a
 * 'handle' method.
 * @return {Object} An object with a handle method.
 *
 * @private
 */
const normalizeHandler = (handler) => {
    if (handler && typeof handler === 'object') {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.hasMethod(handler, 'handle', {
                moduleName: 'workbox-routing',
                className: 'Route',
                funcName: 'constructor',
                paramName: 'handler',
            });
        }
        return handler;
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isType(handler, 'function', {
                moduleName: 'workbox-routing',
                className: 'Route',
                funcName: 'constructor',
                paramName: 'handler',
            });
        }
        return { handle: handler };
    }
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * A `Route` consists of a pair of callback functions, "match" and "handler".
 * The "match" callback determine if a route should be used to "handle" a
 * request by returning a non-falsy value if it can. The "handler" callback
 * is called when there is a match and should return a Promise that resolves
 * to a `Response`.
 *
 * @memberof module:workbox-routing
 */
class Route {
    /**
     * Constructor for Route class.
     *
     * @param {module:workbox-routing~matchCallback} match
     * A callback function that determines whether the route matches a given
     * `fetch` event by returning a non-falsy value.
     * @param {module:workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resolving to a Response.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     */
    constructor(match, handler, method = defaultMethod) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isType(match, 'function', {
                moduleName: 'workbox-routing',
                className: 'Route',
                funcName: 'constructor',
                paramName: 'match',
            });
            if (method) {
                finalAssertExports.isOneOf(method, validMethods, { paramName: 'method' });
            }
        }
        // These values are referenced directly by Router so cannot be
        // altered by minificaton.
        this.handler = normalizeHandler(handler);
        this.match = match;
        this.method = method;
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * RegExpRoute makes it easy to create a regular expression based
 * [Route]{@link module:workbox-routing.Route}.
 *
 * For same-origin requests the RegExp only needs to match part of the URL. For
 * requests against third-party servers, you must define a RegExp that matches
 * the start of the URL.
 *
 * [See the module docs for info.]{@link https://developers.google.com/web/tools/workbox/modules/workbox-routing}
 *
 * @memberof module:workbox-routing
 * @extends module:workbox-routing.Route
 */
class RegExpRoute extends Route {
    /**
     * If the regular expression contains
     * [capture groups]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references},
     * the captured values will be passed to the
     * [handler's]{@link module:workbox-routing~handlerCallback} `params`
     * argument.
     *
     * @param {RegExp} regExp The regular expression to match against URLs.
     * @param {module:workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     */
    constructor(regExp, handler, method) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isInstance(regExp, RegExp, {
                moduleName: 'workbox-routing',
                className: 'RegExpRoute',
                funcName: 'constructor',
                paramName: 'pattern',
            });
        }
        const match = ({ url }) => {
            const result = regExp.exec(url.href);
            // Return immediately if there's no match.
            if (!result) {
                return;
            }
            // Require that the match start at the first character in the URL string
            // if it's a cross-origin request.
            // See https://github.com/GoogleChrome/workbox/issues/281 for the context
            // behind this behavior.
            if ((url.origin !== location.origin) && (result.index !== 0)) {
                if (process.env.NODE_ENV !== 'production') {
                    logger.debug(`The regular expression '${regExp}' only partially matched ` +
                        `against the cross-origin URL '${url}'. RegExpRoute's will only ` +
                        `handle cross-origin requests if they match the entire URL.`);
                }
                return;
            }
            // If the route matches, but there aren't any capture groups defined, then
            // this will return [], which is truthy and therefore sufficient to
            // indicate a match.
            // If there are capture groups, then it will return their values.
            return result.slice(1);
        };
        super(match, handler, method);
    }
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * The Router can be used to process a FetchEvent through one or more
 * [Routes]{@link module:workbox-routing.Route} responding  with a Request if
 * a matching route exists.
 *
 * If no route matches a given a request, the Router will use a "default"
 * handler if one is defined.
 *
 * Should the matching Route throw an error, the Router will use a "catch"
 * handler if one is defined to gracefully deal with issues and respond with a
 * Request.
 *
 * If a request matches multiple routes, the **earliest** registered route will
 * be used to respond to the request.
 *
 * @memberof module:workbox-routing
 */
class Router {
    /**
     * Initializes a new Router.
     */
    constructor() {
        this._routes = new Map();
    }
    /**
     * @return {Map<string, Array<module:workbox-routing.Route>>} routes A `Map` of HTTP
     * method name ('GET', etc.) to an array of all the corresponding `Route`
     * instances that are registered.
     */
    get routes() {
        return this._routes;
    }
    /**
     * Adds a fetch event listener to respond to events when a route matches
     * the event's request.
     */
    addFetchListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('fetch', ((event) => {
            const { request } = event;
            const responsePromise = this.handleRequest({ request, event });
            if (responsePromise) {
                event.respondWith(responsePromise);
            }
        }));
    }
    /**
     * Adds a message event listener for URLs to cache from the window.
     * This is useful to cache resources loaded on the page prior to when the
     * service worker started controlling it.
     *
     * The format of the message data sent from the window should be as follows.
     * Where the `urlsToCache` array may consist of URL strings or an array of
     * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
     *
     * ```
     * {
     *   type: 'CACHE_URLS',
     *   payload: {
     *     urlsToCache: [
     *       './script1.js',
     *       './script2.js',
     *       ['./script3.js', {mode: 'no-cors'}],
     *     ],
     *   },
     * }
     * ```
     */
    addCacheListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('message', ((event) => {
            if (event.data && event.data.type === 'CACHE_URLS') {
                const { payload } = event.data;
                if (process.env.NODE_ENV !== 'production') {
                    logger.debug(`Caching URLs from the window`, payload.urlsToCache);
                }
                const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
                    if (typeof entry === 'string') {
                        entry = [entry];
                    }
                    const request = new Request(...entry);
                    return this.handleRequest({ request });
                    // TODO(philipwalton): TypeScript errors without this typecast for
                    // some reason (probably a bug). The real type here should work but
                    // doesn't: `Array<Promise<Response> | undefined>`.
                })); // TypeScript
                event.waitUntil(requestPromises);
                // If a MessageChannel was used, reply to the message on success.
                if (event.ports && event.ports[0]) {
                    requestPromises.then(() => event.ports[0].postMessage(true));
                }
            }
        }));
    }
    /**
     * Apply the routing rules to a FetchEvent object to get a Response from an
     * appropriate Route's handler.
     *
     * @param {Object} options
     * @param {Request} options.request The request to handle (this is usually
     *     from a fetch event, but it does not have to be).
     * @param {FetchEvent} [options.event] The event that triggered the request,
     *     if applicable.
     * @return {Promise<Response>|undefined} A promise is returned if a
     *     registered route can handle the request. If there is no matching
     *     route and there's no `defaultHandler`, `undefined` is returned.
     */
    handleRequest({ request, event }) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isInstance(request, Request, {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'handleRequest',
                paramName: 'options.request',
            });
        }
        const url = new URL(request.url, location.href);
        if (!url.protocol.startsWith('http')) {
            if (process.env.NODE_ENV !== 'production') {
                logger.debug(`Workbox Router only supports URLs that start with 'http'.`);
            }
            return;
        }
        const { params, route } = this.findMatchingRoute({ url, request, event });
        let handler = route && route.handler;
        const debugMessages = [];
        if (process.env.NODE_ENV !== 'production') {
            if (handler) {
                debugMessages.push([
                    `Found a route to handle this request:`, route,
                ]);
                if (params) {
                    debugMessages.push([
                        `Passing the following params to the route's handler:`, params,
                    ]);
                }
            }
        }
        // If we don't have a handler because there was no matching route, then
        // fall back to defaultHandler if that's defined.
        if (!handler && this._defaultHandler) {
            if (process.env.NODE_ENV !== 'production') {
                debugMessages.push(`Failed to find a matching route. Falling ` +
                    `back to the default handler.`);
            }
            handler = this._defaultHandler;
        }
        if (!handler) {
            if (process.env.NODE_ENV !== 'production') {
                // No handler so Workbox will do nothing. If logs is set of debug
                // i.e. verbose, we should print out this information.
                logger.debug(`No route found for: ${getFriendlyURL(url)}`);
            }
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            // We have a handler, meaning Workbox is going to handle the route.
            // print the routing details to the console.
            logger.groupCollapsed(`Router is responding to: ${getFriendlyURL(url)}`);
            debugMessages.forEach((msg) => {
                if (Array.isArray(msg)) {
                    logger.log(...msg);
                }
                else {
                    logger.log(msg);
                }
            });
            logger.groupEnd();
        }
        // Wrap in try and catch in case the handle method throws a synchronous
        // error. It should still callback to the catch handler.
        let responsePromise;
        try {
            responsePromise = handler.handle({ url, request, event, params });
        }
        catch (err) {
            responsePromise = Promise.reject(err);
        }
        if (responsePromise instanceof Promise && this._catchHandler) {
            responsePromise = responsePromise.catch((err) => {
                if (process.env.NODE_ENV !== 'production') {
                    // Still include URL here as it will be async from the console group
                    // and may not make sense without the URL
                    logger.groupCollapsed(`Error thrown when responding to: ` +
                        ` ${getFriendlyURL(url)}. Falling back to Catch Handler.`);
                    logger.error(`Error thrown by:`, route);
                    logger.error(err);
                    logger.groupEnd();
                }
                return this._catchHandler.handle({ url, request, event });
            });
        }
        return responsePromise;
    }
    /**
     * Checks a request and URL (and optionally an event) against the list of
     * registered routes, and if there's a match, returns the corresponding
     * route along with any params generated by the match.
     *
     * @param {Object} options
     * @param {URL} options.url
     * @param {Request} options.request The request to match.
     * @param {Event} [options.event] The corresponding event (unless N/A).
     * @return {Object} An object with `route` and `params` properties.
     *     They are populated if a matching route was found or `undefined`
     *     otherwise.
     */
    findMatchingRoute({ url, request, event }) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isInstance(url, URL, {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'findMatchingRoute',
                paramName: 'options.url',
            });
            finalAssertExports.isInstance(request, Request, {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'findMatchingRoute',
                paramName: 'options.request',
            });
        }
        const routes = this._routes.get(request.method) || [];
        for (const route of routes) {
            let params;
            const matchResult = route.match({ url, request, event });
            if (matchResult) {
                // See https://github.com/GoogleChrome/workbox/issues/2079
                params = matchResult;
                if (Array.isArray(matchResult) && matchResult.length === 0) {
                    // Instead of passing an empty array in as params, use undefined.
                    params = undefined;
                }
                else if ((matchResult.constructor === Object &&
                    Object.keys(matchResult).length === 0)) {
                    // Instead of passing an empty object in as params, use undefined.
                    params = undefined;
                }
                else if (typeof matchResult === 'boolean') {
                    // For the boolean value true (rather than just something truth-y),
                    // don't set params.
                    // See https://github.com/GoogleChrome/workbox/pull/2134#issuecomment-513924353
                    params = undefined;
                }
                // Return early if have a match.
                return { route, params };
            }
        }
        // If no match was found above, return and empty object.
        return {};
    }
    /**
     * Define a default `handler` that's called when no routes explicitly
     * match the incoming request.
     *
     * Without a default handler, unmatched requests will go against the
     * network as if there were no service worker present.
     *
     * @param {module:workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     */
    setDefaultHandler(handler) {
        this._defaultHandler = normalizeHandler(handler);
    }
    /**
     * If a Route throws an error while handling a request, this `handler`
     * will be called and given a chance to provide a response.
     *
     * @param {module:workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     */
    setCatchHandler(handler) {
        this._catchHandler = normalizeHandler(handler);
    }
    /**
     * Registers a route with the router.
     *
     * @param {module:workbox-routing.Route} route The route to register.
     */
    registerRoute(route) {
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isType(route, 'object', {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'registerRoute',
                paramName: 'route',
            });
            finalAssertExports.hasMethod(route, 'match', {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'registerRoute',
                paramName: 'route',
            });
            finalAssertExports.isType(route.handler, 'object', {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'registerRoute',
                paramName: 'route',
            });
            finalAssertExports.hasMethod(route.handler, 'handle', {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'registerRoute',
                paramName: 'route.handler',
            });
            finalAssertExports.isType(route.method, 'string', {
                moduleName: 'workbox-routing',
                className: 'Router',
                funcName: 'registerRoute',
                paramName: 'route.method',
            });
        }
        if (!this._routes.has(route.method)) {
            this._routes.set(route.method, []);
        }
        // Give precedence to all of the earlier routes by adding this additional
        // route to the end of the array.
        this._routes.get(route.method).push(route);
    }
    /**
     * Unregisters a route with the router.
     *
     * @param {module:workbox-routing.Route} route The route to unregister.
     */
    unregisterRoute(route) {
        if (!this._routes.has(route.method)) {
            throw new WorkboxError('unregister-route-but-not-found-with-method', {
                method: route.method,
            });
        }
        const routeIndex = this._routes.get(route.method).indexOf(route);
        if (routeIndex > -1) {
            this._routes.get(route.method).splice(routeIndex, 1);
        }
        else {
            throw new WorkboxError('unregister-route-route-not-registered');
        }
    }
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
let defaultRouter;
/**
 * Creates a new, singleton Router instance if one does not exist. If one
 * does already exist, that instance is returned.
 *
 * @private
 * @return {Router}
 */
const getOrCreateDefaultRouter = () => {
    if (!defaultRouter) {
        defaultRouter = new Router();
        // The helpers that use the default Router assume these listeners exist.
        defaultRouter.addFetchListener();
        defaultRouter.addCacheListener();
    }
    return defaultRouter;
};

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * Easily register a RegExp, string, or function with a caching
 * strategy to a singleton Router instance.
 *
 * This method will generate a Route for you if needed and
 * call [registerRoute()]{@link module:workbox-routing.Router#registerRoute}.
 *
 * @param {RegExp|string|module:workbox-routing.Route~matchCallback|module:workbox-routing.Route} capture
 * If the capture param is a `Route`, all other arguments will be ignored.
 * @param {module:workbox-routing~handlerCallback} [handler] A callback
 * function that returns a Promise resulting in a Response. This parameter
 * is required if `capture` is not a `Route` object.
 * @param {string} [method='GET'] The HTTP method to match the Route
 * against.
 * @return {module:workbox-routing.Route} The generated `Route`(Useful for
 * unregistering).
 *
 * @memberof module:workbox-routing
 */
function registerRoute(capture, handler, method) {
    let route;
    if (typeof capture === 'string') {
        const captureUrl = new URL(capture, location.href);
        if (process.env.NODE_ENV !== 'production') {
            if (!(capture.startsWith('/') || capture.startsWith('http'))) {
                throw new WorkboxError('invalid-string', {
                    moduleName: 'workbox-routing',
                    funcName: 'registerRoute',
                    paramName: 'capture',
                });
            }
            // We want to check if Express-style wildcards are in the pathname only.
            // TODO: Remove this log message in v4.
            const valueToCheck = capture.startsWith('http') ?
                captureUrl.pathname : capture;
            // See https://github.com/pillarjs/path-to-regexp#parameters
            const wildcards = '[*:?+]';
            if ((new RegExp(`${wildcards}`)).exec(valueToCheck)) {
                logger.debug(`The '$capture' parameter contains an Express-style wildcard ` +
                    `character (${wildcards}). Strings are now always interpreted as ` +
                    `exact matches; use a RegExp for partial or wildcard matches.`);
            }
        }
        const matchCallback = ({ url }) => {
            if (process.env.NODE_ENV !== 'production') {
                if ((url.pathname === captureUrl.pathname) &&
                    (url.origin !== captureUrl.origin)) {
                    logger.debug(`${capture} only partially matches the cross-origin URL ` +
                        `${url}. This route will only handle cross-origin requests ` +
                        `if they match the entire URL.`);
                }
            }
            return url.href === captureUrl.href;
        };
        // If `capture` is a string then `handler` and `method` must be present.
        route = new Route(matchCallback, handler, method);
    }
    else if (capture instanceof RegExp) {
        // If `capture` is a `RegExp` then `handler` and `method` must be present.
        route = new RegExpRoute(capture, handler, method);
    }
    else if (typeof capture === 'function') {
        // If `capture` is a function then `handler` and `method` must be present.
        route = new Route(capture, handler, method);
    }
    else if (capture instanceof Route) {
        route = capture;
    }
    else {
        throw new WorkboxError('unsupported-route-type', {
            moduleName: 'workbox-routing',
            funcName: 'registerRoute',
            paramName: 'capture',
        });
    }
    const defaultRouter = getOrCreateDefaultRouter();
    defaultRouter.registerRoute(route);
    return route;
}

// @ts-ignore
try {
    self['workbox:strategies:5.1.4'] && _();
}
catch (e) { }

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const messages = {
    strategyStart: (strategyName, request) => `Using ${strategyName} to respond to '${getFriendlyURL(request.url)}'`,
    printFinalResponse: (response) => {
        if (response) {
            logger.groupCollapsed(`View the final response here.`);
            logger.log(response || '[No response returned]');
            logger.groupEnd();
        }
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
const cacheOkAndOpaquePlugin = {
    /**
     * Returns a valid response (to allow caching) if the status is 200 (OK) or
     * 0 (opaque).
     *
     * @param {Object} options
     * @param {Response} options.response
     * @return {Response|null}
     *
     * @private
     */
    cacheWillUpdate: async ({ response }) => {
        if (response.status === 200 || response.status === 0) {
            return response;
        }
        return null;
    },
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
/**
 * An implementation of a
 * [stale-while-revalidate]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate}
 * request strategy.
 *
 * Resources are requested from both the cache and the network in parallel.
 * The strategy will respond with the cached version if available, otherwise
 * wait for the network response. The cache is updated with the network response
 * with each successful request.
 *
 * By default, this strategy will cache responses with a 200 status code as
 * well as [opaque responses]{@link https://developers.google.com/web/tools/workbox/guides/handle-third-party-requests}.
 * Opaque responses are cross-origin requests where the response doesn't
 * support [CORS]{@link https://enable-cors.org/}.
 *
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 *
 * @memberof module:workbox-strategies
 */
class StaleWhileRevalidate {
    /**
     * @param {Object} options
     * @param {string} options.cacheName Cache name to store and retrieve
     * requests. Defaults to cache names provided by
     * [workbox-core]{@link module:workbox-core.cacheNames}.
     * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * to use in conjunction with this caching strategy.
     * @param {Object} options.fetchOptions Values passed along to the
     * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
     * of all fetch() requests made by this strategy.
     * @param {Object} options.matchOptions [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
     */
    constructor(options = {}) {
        this._cacheName = cacheNames.getRuntimeName(options.cacheName);
        this._plugins = options.plugins || [];
        if (options.plugins) {
            const isUsingCacheWillUpdate = options.plugins.some((plugin) => !!plugin.cacheWillUpdate);
            this._plugins = isUsingCacheWillUpdate ?
                options.plugins : [cacheOkAndOpaquePlugin, ...options.plugins];
        }
        else {
            // No plugins passed in, use the default plugin.
            this._plugins = [cacheOkAndOpaquePlugin];
        }
        this._fetchOptions = options.fetchOptions;
        this._matchOptions = options.matchOptions;
    }
    /**
     * This method will perform a request strategy and follows an API that
     * will work with the
     * [Workbox Router]{@link module:workbox-routing.Router}.
     *
     * @param {Object} options
     * @param {Request|string} options.request A request to run this strategy for.
     * @param {Event} [options.event] The event that triggered the request.
     * @return {Promise<Response>}
     */
    async handle({ event, request }) {
        const logs = [];
        if (typeof request === 'string') {
            request = new Request(request);
        }
        if (process.env.NODE_ENV !== 'production') {
            finalAssertExports.isInstance(request, Request, {
                moduleName: 'workbox-strategies',
                className: 'StaleWhileRevalidate',
                funcName: 'handle',
                paramName: 'request',
            });
        }
        const fetchAndCachePromise = this._getFromNetwork({ request, event });
        let response = await cacheWrapper.match({
            cacheName: this._cacheName,
            request,
            event,
            matchOptions: this._matchOptions,
            plugins: this._plugins,
        });
        let error;
        if (response) {
            if (process.env.NODE_ENV !== 'production') {
                logs.push(`Found a cached response in the '${this._cacheName}'` +
                    ` cache. Will update with the network response in the background.`);
            }
            if (event) {
                try {
                    event.waitUntil(fetchAndCachePromise);
                }
                catch (error) {
                    if (process.env.NODE_ENV !== 'production') {
                        logger.warn(`Unable to ensure service worker stays alive when ` +
                            `updating cache for '${getFriendlyURL(request.url)}'.`);
                    }
                }
            }
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                logs.push(`No response found in the '${this._cacheName}' cache. ` +
                    `Will wait for the network response.`);
            }
            try {
                response = await fetchAndCachePromise;
            }
            catch (err) {
                error = err;
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            logger.groupCollapsed(messages.strategyStart('StaleWhileRevalidate', request));
            for (const log of logs) {
                logger.log(log);
            }
            messages.printFinalResponse(response);
            logger.groupEnd();
        }
        if (!response) {
            throw new WorkboxError('no-response', { url: request.url, error });
        }
        return response;
    }
    /**
     * @param {Object} options
     * @param {Request} options.request
     * @param {Event} [options.event]
     * @return {Promise<Response>}
     *
     * @private
     */
    async _getFromNetwork({ request, event }) {
        const response = await fetchWrapper.fetch({
            request,
            event,
            fetchOptions: this._fetchOptions,
            plugins: this._plugins,
        });
        const cachePutPromise = cacheWrapper.put({
            cacheName: this._cacheName,
            request,
            response: response.clone(),
            event,
            plugins: this._plugins,
        });
        if (event) {
            try {
                event.waitUntil(cachePutPromise);
            }
            catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    logger.warn(`Unable to ensure service worker stays alive when ` +
                        `updating cache for '${getFriendlyURL(request.url)}'.`);
                }
            }
        }
        return response;
    }
}

/// <reference lib="webworker" />
clientsClaim();
// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute(self.__WB_MANIFEST);
// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
// Return false to exempt requests from being fulfilled by index.html.
({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== "navigate") {
        return false;
    }
    // If this is a URL that starts with /_, skip.
    if (url.pathname.startsWith("/_")) {
        return false;
    }
    // If this looks like a URL for a resource, because it contains
    // a file extension, skip.
    if (url.pathname.match(fileExtensionRegexp)) {
        return false;
    }
    // Return true to signal that we want to use the handler.
    return true;
}, createHandlerBoundToURL(window.location.href + "/index.html"));
// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
// Add in any other file extensions or routing criteria as needed.
({ url }) => url.origin === self.location.origin && url.pathname.endsWith(".png"), 
// Customize this strategy as needed, e.g., by changing to CacheFirst.
new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
        // Ensure that once this runtime cache reaches a maximum size the
        // least-recently used images are removed.
        new ExpirationPlugin({ maxEntries: 50 }),
    ],
}));
// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
// Any other custom service worker logic can go here.
