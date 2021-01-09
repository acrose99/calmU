
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
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

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    /* src/components/CalmusArray.svelte generated by Svelte v3.31.1 */

    const { console: console_1 } = globals;
    const file = "src/components/CalmusArray.svelte";

    // (133:4) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "bigCamus");
    			attr_dev(img, "alt", "logo");
    			if (img.src !== (img_src_value = /*Calmuses*/ ctx[4][/*mid*/ ctx[1]].calmusIMG)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1hqth54");
    			add_location(img, file, 133, 8, 4263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "mouseenter", /*mouseenter_handler_1*/ ctx[11], false, false, false),
    					listen_dev(img, "click", /*click_handler_1*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*mid*/ 2 && img.src !== (img_src_value = /*Calmuses*/ ctx[4][/*mid*/ ctx[1]].calmusIMG)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fade, { delay: 4000, duration: 500 });
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(133:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:4) {#if playing}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "bigCamusSpin");
    			attr_dev(img, "alt", "logo");
    			if (img.src !== (img_src_value = /*Calmuses*/ ctx[4][/*mid*/ ctx[1]].calmusIMGHeadphones)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1hqth54");
    			add_location(img, file, 131, 8, 4141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*mid*/ 2 && img.src !== (img_src_value = /*Calmuses*/ ctx[4][/*mid*/ ctx[1]].calmusIMGHeadphones)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(131:4) {#if playing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let img0;
    	let img0_src_value;
    	let img0_intro;
    	let t0;
    	let t1;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let div0_intro;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*playing*/ ctx[3]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img0 = element("img");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			div0 = element("div");
    			img1 = element("img");
    			set_style(img0, "left", "50px");
    			attr_dev(img0, "class", "smallCamus svelte-1hqth54");
    			attr_dev(img0, "alt", "logo");
    			if (img0.src !== (img0_src_value = /*Calmuses*/ ctx[4][/*left*/ ctx[0]].calmusIMG)) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file, 129, 4, 3929);
    			set_style(img1, "right", "50px");
    			attr_dev(img1, "class", "smallCamus svelte-1hqth54");
    			attr_dev(img1, "alt", "logo");
    			if (img1.src !== (img1_src_value = /*Calmuses*/ ctx[4][/*right*/ ctx[2]].calmusIMG)) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file, 136, 8, 4583);
    			attr_dev(div0, "class", "svelte-1hqth54");
    			add_location(div0, file, 135, 4, 4468);
    			attr_dev(div1, "class", "svelte-1hqth54");
    			add_location(div1, file, 128, 0, 3919);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			if_block.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "mouseenter", /*mouseenter_handler*/ ctx[9], false, false, false),
    					listen_dev(div0, "mouseenter", /*mouseenter_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left*/ 1 && img0.src !== (img0_src_value = /*Calmuses*/ ctx[4][/*left*/ ctx[0]].calmusIMG)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t1);
    				}
    			}

    			if (dirty & /*right*/ 4 && img1.src !== (img1_src_value = /*Calmuses*/ ctx[4][/*right*/ ctx[2]].calmusIMG)) {
    				attr_dev(img1, "src", img1_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (!img0_intro) {
    				add_render_callback(() => {
    					img0_intro = create_in_transition(img0, fade, { delay: 4000, duration: 500 });
    					img0_intro.start();
    				});
    			}

    			transition_in(if_block);

    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fade, { delay: 4000, duration: 500 });
    					div0_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CalmusArray", slots, []);
    	const dispatch = createEventDispatcher();
    	let left = 0;
    	let mid = 1;
    	let right = 2;
    	let playing = false;

    	let Calmuses = [
    		{
    			calmusType: "Space",
    			calmusIMG: "../images/Calmus/CalmusSpace.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusSpace.png"
    		},
    		{
    			calmusType: "Ocean",
    			calmusIMG: "../images/Calmus/CalmusOcean.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusOcean.png"
    		},
    		{
    			calmusType: "Forest",
    			calmusIMG: "../images/Calmus/CalmusForest.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusForest.png"
    		},
    		{
    			calmusType: "Fan",
    			calmusIMG: "../images/Calmus/CalmusDefault.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusDefault.png"
    		},
    		{
    			calmusType: "City",
    			calmusIMG: "../images/Calmus/CalmusCity.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusCity.png"
    		},
    		{
    			calmusType: "White Noise",
    			calmusIMG: "../images/Calmus/CalmusWhiteNoise.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusWhiteNoise.png"
    		},
    		{
    			calmusType: "Coffee",
    			calmusIMG: "../images/Calmus/CalmusCoffee.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusCoffee.png"
    		},
    		{
    			calmusType: "Office",
    			calmusIMG: "../images/Calmus/CalmusOffice.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusOffice.png"
    		},
    		{
    			calmusType: "Library",
    			calmusIMG: "../images/Calmus/CalmusLibrary.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusLibrary.png"
    		},
    		{
    			calmusType: "Fire",
    			calmusIMG: "../images/Calmus/CalmusFire.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusFire.png"
    		},
    		{
    			calmusType: "Train",
    			calmusIMG: "../images/Calmus/CalmusTrain.png",
    			calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusTrain.png"
    		}
    	];

    	function handleMousemoveLeft() {
    		$$invalidate(3, playing = false);

    		if (left === 0) {
    			//Todo
    			$$invalidate(1, mid = 0);

    			$$invalidate(0, left = 10);
    			$$invalidate(2, right = 1);
    		} else if (left === 10) {
    			$$invalidate(1, mid = 10);
    			$$invalidate(0, left = 9);
    			$$invalidate(2, right = 0);
    		} else if (right === 0) {
    			$$invalidate(1, mid = 9);
    			$$invalidate(0, left = 8);
    			$$invalidate(2, right = 10);
    		} else {
    			$$invalidate(0, left--, left);
    			$$invalidate(1, mid--, mid);
    			$$invalidate(2, right--, right);
    		}

    		console.log("Right:" + right);
    		console.log("Left:" + left);
    		dispatch("notify", { type: Calmuses[mid].calmusType });
    	}

    	function handleMousemoveCenter() {
    		// console.log("Help");
    		dispatch("notify", { type: Calmuses[mid].calmusType });
    	}

    	function handleMousemoveRight() {
    		$$invalidate(3, playing = false);
    		console.log("Right:" + right);
    		console.log("Middle:" + mid);
    		console.log("Left:" + left);

    		if (right === 10) {
    			$$invalidate(0, left = 8);
    			$$invalidate(1, mid = 10);
    			$$invalidate(2, right = 0);
    		} else if (mid === 10) {
    			$$invalidate(0, left = 10);
    			$$invalidate(1, mid = 0);
    			$$invalidate(2, right = 1);
    		} else if (left === 10) {
    			$$invalidate(0, left = 0);
    			$$invalidate(1, mid = 1);
    			$$invalidate(2, right = 2);
    		} else {
    			$$invalidate(0, left++, left);
    			$$invalidate(1, mid++, mid);
    			$$invalidate(2, right++, right);
    		}

    		dispatch("notify", { type: Calmuses[mid].calmusType });
    	}

    	function onClick() {
    		$$invalidate(3, playing = playing !== true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<CalmusArray> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => setTimeout(handleMousemoveLeft, 150);
    	const click_handler = () => onClick();
    	const mouseenter_handler_1 = () => setTimeout(handleMousemoveCenter, 150);
    	const click_handler_1 = () => onClick();
    	const mouseenter_handler_2 = () => setTimeout(handleMousemoveRight, 150);

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		crossfade,
    		scale,
    		slide,
    		linear: identity,
    		tick,
    		createEventDispatcher,
    		dispatch,
    		left,
    		mid,
    		right,
    		playing,
    		Calmuses,
    		handleMousemoveLeft,
    		handleMousemoveCenter,
    		handleMousemoveRight,
    		onClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("mid" in $$props) $$invalidate(1, mid = $$props.mid);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("playing" in $$props) $$invalidate(3, playing = $$props.playing);
    		if ("Calmuses" in $$props) $$invalidate(4, Calmuses = $$props.Calmuses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		left,
    		mid,
    		right,
    		playing,
    		Calmuses,
    		handleMousemoveLeft,
    		handleMousemoveCenter,
    		handleMousemoveRight,
    		onClick,
    		mouseenter_handler,
    		click_handler,
    		mouseenter_handler_1,
    		click_handler_1,
    		mouseenter_handler_2
    	];
    }

    class CalmusArray extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CalmusArray",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/container/Home.svelte generated by Svelte v3.31.1 */

    const { Error: Error_1, console: console_1$1 } = globals;
    const file$1 = "src/container/Home.svelte";

    // (139:4) {#if typing}
    function create_if_block_2(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;
    	let t0;
    	let h1;
    	let h1_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Calming Ambient Noise, for as long as you want.";
    			attr_dev(img, "class", "logo");
    			attr_dev(img, "alt", "Logo");
    			if (img.src !== (img_src_value = /*srcLogo*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 139, 8, 4683);
    			attr_dev(h1, "class", "svelte-1xsjyr6");
    			add_location(h1, file$1, 141, 8, 4777);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fade, { delay: 200, duration: 400 });
    					img_intro.start();
    				});
    			}

    			if (!h1_intro) {
    				add_render_callback(() => {
    					h1_intro = create_in_transition(h1, typewriter, {});
    					h1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(139:4) {#if typing}",
    		ctx
    	});

    	return block;
    }

    // (147:4) {#if typeDone}
    function create_if_block$1(ctx) {
    	let calmusarray;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let h1_intro;
    	let t3;
    	let if_block_anchor;
    	let current;
    	calmusarray = new CalmusArray({ $$inline: true });
    	calmusarray.$on("notify", /*handleMessage*/ ctx[5]);
    	let if_block = !/*mousedOver*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			create_component(calmusarray.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text("Ambience Selected: ");
    			t2 = text(/*type*/ ctx[0]);
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h1, "class", "svelte-1xsjyr6");
    			add_location(h1, file$1, 148, 8, 4958);
    		},
    		m: function mount(target, anchor) {
    			mount_component(calmusarray, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*type*/ 1) set_data_dev(t2, /*type*/ ctx[0]);

    			if (!/*mousedOver*/ ctx[3]) {
    				if (if_block) {
    					if (dirty & /*mousedOver*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calmusarray.$$.fragment, local);

    			if (!h1_intro) {
    				add_render_callback(() => {
    					h1_intro = create_in_transition(h1, fade, { delay: 4000, duration: 500 });
    					h1_intro.start();
    				});
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calmusarray.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(calmusarray, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(147:4) {#if typeDone}",
    		ctx
    	});

    	return block;
    }

    // (150:8) {#if !mousedOver}
    function create_if_block_1(ctx) {
    	let h20;
    	let h20_intro;
    	let h20_outro;
    	let t1;
    	let h21;
    	let h21_intro;
    	let h21_outro;
    	let t3;
    	let h22;
    	let h22_intro;
    	let h22_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "10 Ambient Backgrounds, one click away.";
    			t1 = space();
    			h21 = element("h2");
    			h21.textContent = "Click to play and pause, scroll to change ambience.";
    			t3 = space();
    			h22 = element("h2");
    			h22.textContent = "Mouse over Calmus to get started.";
    			attr_dev(h20, "class", "svelte-1xsjyr6");
    			add_location(h20, file$1, 150, 12, 5072);
    			set_style(h21, "font-weight", "bolder");
    			attr_dev(h21, "class", "svelte-1xsjyr6");
    			add_location(h21, file$1, 153, 12, 5242);
    			set_style(h22, "font-weight", "bolder");
    			attr_dev(h22, "class", "svelte-1xsjyr6");
    			add_location(h22, file$1, 156, 12, 5451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h22, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (h20_outro) h20_outro.end(1);
    				if (!h20_intro) h20_intro = create_in_transition(h20, fade, { delay: 1000, duration: 400 });
    				h20_intro.start();
    			});

    			add_render_callback(() => {
    				if (h21_outro) h21_outro.end(1);
    				if (!h21_intro) h21_intro = create_in_transition(h21, fade, { delay: 2000, duration: 400 });
    				h21_intro.start();
    			});

    			add_render_callback(() => {
    				if (h22_outro) h22_outro.end(1);
    				if (!h22_intro) h22_intro = create_in_transition(h22, fade, { delay: 3000, duration: 400 });
    				h22_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (h20_intro) h20_intro.invalidate();
    			h20_outro = create_out_transition(h20, fly, { x: 300, duration: 3000 });
    			if (h21_intro) h21_intro.invalidate();
    			h21_outro = create_out_transition(h21, fly, { x: 300, duration: 3000 });
    			if (h22_intro) h22_intro.invalidate();
    			h22_outro = create_out_transition(h22, fly, { x: 300, duration: 3000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching && h20_outro) h20_outro.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h21);
    			if (detaching && h21_outro) h21_outro.end();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h22);
    			if (detaching && h22_outro) h22_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(150:8) {#if !mousedOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block0 = /*typing*/ ctx[1] && create_if_block_2(ctx);
    	let if_block1 = /*typeDone*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-1xsjyr6");
    			add_location(div, file$1, 137, 0, 4637);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*typing*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*typing*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*typeDone*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*typeDone*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function typewriter(node, { speed = 100 }) {
    	const valid = node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;

    	if (!valid) {
    		throw new Error(`This transition only works on elements with a single text node child`);
    	}

    	const text = node.textContent;
    	const duration = text.length * speed;

    	return {
    		duration,
    		tick: t => {
    			const i = ~~(text.length * t);
    			node.textContent = text.slice(0, i);
    		}
    	};
    }

    function changeBackground(type) {
    	console.log("Parsed type:" + type);

    	//toggles everything off first to avoid bugs, wish Svelte handled alot of this stuff better, oh well.
    	if (window.document.body.classList.contains("blue-mode")) {
    		window.document.body.classList.toggle("blue-mode");
    	}

    	if (window.document.body.classList.contains("city-mode")) {
    		window.document.body.classList.toggle("city-mode");
    	}

    	if (window.document.body.classList.contains("fire-mode")) {
    		window.document.body.classList.toggle("fire-mode");
    	}

    	if (window.document.body.classList.contains("forest-mode")) {
    		window.document.body.classList.toggle("forest-mode");
    	}

    	if (window.document.body.classList.contains("coffee-mode")) {
    		window.document.body.classList.toggle("coffee-mode");
    	}

    	if (window.document.body.classList.contains("whiteNoise-mode")) {
    		window.document.body.classList.toggle("whiteNoise-mode");
    	}

    	if (window.document.body.classList.contains("space-mode")) {
    		window.document.body.classList.toggle("space-mode");
    	}

    	if (window.document.body.classList.contains("office-mode")) {
    		window.document.body.classList.toggle("office-mode");
    	}

    	if (window.document.body.classList.contains("library-mode")) {
    		window.document.body.classList.toggle("library-mode");
    	}

    	if (window.document.body.classList.contains("train-mode")) {
    		window.document.body.classList.toggle("train-mode");
    	}

    	if (window.document.body.classList.contains("fan-mode")) {
    		window.document.body.classList.toggle("fan-mode");
    	}

    	//toggles everything on.
    	if (type === "None" || type === "Default") {
    		window.document.body.classList.toggle("ocean-mode");
    	}

    	if (type === "City") {
    		window.document.body.classList.toggle("city-mode");
    	}

    	if (type === "Forest") {
    		window.document.body.classList.toggle("forest-mode");
    	}

    	if (type === "Fire") {
    		window.document.body.classList.toggle("fire-mode");
    	}

    	if (type === "Coffee") {
    		window.document.body.classList.toggle("coffee-mode");
    	}

    	if (type === "White Noise") {
    		window.document.body.classList.toggle("whiteNoise-mode");
    	}

    	if (type === "Space") {
    		window.document.body.classList.toggle("space-mode");
    	}

    	if (type === "Office") {
    		window.document.body.classList.toggle("office-mode");
    	}

    	if (type === "Library") {
    		window.document.body.classList.toggle("library-mode");
    	}

    	if (type === "Library") {
    		window.document.body.classList.toggle("train-mode");
    	}

    	if (type === "Fan") {
    		window.document.body.classList.toggle("fan-mode");
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let srcLogo = "../images/Homepage/Logo.svg";
    	let srcCalmus = "../images/Calmus/CalmusOcean.png";
    	let type = "None";
    	let typing = false;
    	let visible = false;
    	let typeDone = false;
    	let mousedOver = false;

    	function handleMessage(event) {
    		$$invalidate(0, type = event.detail.type);
    		console.log("Type: " + type);
    		changeBackground(type);
    		$$invalidate(3, mousedOver = true);
    	}

    	function setVisible() {
    		$$invalidate(1, typing = true);
    	}

    	function typeWriterMount() {
    		$$invalidate(1, typing = true);
    	}

    	function setTypingDone() {
    		$$invalidate(2, typeDone = true);
    	}

    	function fadeAsync() {
    		$$invalidate(1, typing = false);
    		setTypingDone();
    	}

    	onMount(async () => {
    		changeBackground(type);
    		typeWriterMount();
    		setInterval(fadeAsync, 6000);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		CalmusArray,
    		fade,
    		fly,
    		crossfade,
    		scale,
    		slide,
    		onMount,
    		srcLogo,
    		srcCalmus,
    		type,
    		typing,
    		visible,
    		typeDone,
    		mousedOver,
    		typewriter,
    		changeBackground,
    		handleMessage,
    		setVisible,
    		typeWriterMount,
    		setTypingDone,
    		fadeAsync
    	});

    	$$self.$inject_state = $$props => {
    		if ("srcLogo" in $$props) $$invalidate(4, srcLogo = $$props.srcLogo);
    		if ("srcCalmus" in $$props) srcCalmus = $$props.srcCalmus;
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("typing" in $$props) $$invalidate(1, typing = $$props.typing);
    		if ("visible" in $$props) visible = $$props.visible;
    		if ("typeDone" in $$props) $$invalidate(2, typeDone = $$props.typeDone);
    		if ("mousedOver" in $$props) $$invalidate(3, mousedOver = $$props.mousedOver);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, typing, typeDone, mousedOver, srcLogo, handleMessage];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/routes/index.svelte generated by Svelte v3.31.1 */
    const file$2 = "src/routes/index.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(home.$$.fragment);
    			attr_dev(main, "class", "svelte-ibf09j");
    			add_location(main, file$2, 4, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(home, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(home);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Routes", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Routes> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Home });
    	return [];
    }

    class Routes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Routes",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new Routes({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
