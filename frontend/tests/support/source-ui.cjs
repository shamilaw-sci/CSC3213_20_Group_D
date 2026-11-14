/**
 * @file source-ui.cjs
 * @module Auth UI regression support
 * @desc Execute trusted JSX handlers with synthetic hook/API boundaries; not a renderer or native-runtime test.
 * @author Codex Review Assistant
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('../../../mobile/node_modules/@babel/core');
const jsx = require('../../../mobile/node_modules/@babel/plugin-transform-react-jsx');
const modules = require('../../../mobile/node_modules/@babel/plugin-transform-modules-commonjs');
const root = path.resolve(__dirname, '../../..');

/** @param {string} file Repo path. @param {Object} mocks Exact imports. @param {Object} globals Synthetic globals.
 * @returns {Object} Actual source exports, after imports are replaced before evaluation.
 */
function load(file, mocks = {}, globals = {}, binding) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const transformed = babel.transformSync(source, { filename: file, babelrc: false, configFile: false,
    plugins: [[jsx, { runtime: 'classic' }], modules] }).code;
  const module = { exports: {} };
  vm.runInNewContext(transformed + (binding ? `\nmodule.exports.default = ${binding};` : ''), { module, exports: module.exports,
    require: name => { if (!Object.hasOwn(mocks, name)) throw new Error(`Unlisted import: ${name}`); return mocks[name]; },
    console: { log() {}, warn() {}, error() {} }, URL, Date, ...globals,
  }, { filename: file });
  return module.exports;
}

/** @param {string} file Actual component path. @param {Object} options Props/import/global substitutions.
 * @returns {Object} Repeatable synthetic hook rendering and JSX-node inspection. Effects only run explicitly.
 */
function screen(file, { props = {}, imports = {}, globals = {}, binding } = {}) {
  let cursor = 0, tree;
  const state = [], effects = [], previous = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'Fragment',
    useMemo: calculate => calculate(),
    useCallback: callback => callback,
    useState: initial => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useRef: initial => { const index = cursor++; return state[index] ||= { current: initial }; },
    useId: () => `fixture-${cursor++}`,
    useEffect: (callback, dependencies) => { const index = cursor++; if (!previous[index] || dependencies?.some((v, i) => v !== previous[index][i])) {
      effects.push(callback); previous[index] = dependencies;
    } },
  };
  const rn = Object.fromEntries(['View','Text','TextInput','TouchableOpacity','ActivityIndicator','KeyboardAvoidingView','ScrollView','Image','StatusBar'].map(name => [name, name]));
  Object.assign(rn, { StyleSheet: { create: value => value }, Platform: { OS: 'android' }, Alert: { alert() {} } });
  const defaultImports = {
    react: { ...React, default: React, __esModule: true }, 'react-native': rn,
    'lucide-react-native': new Proxy({}, { get: (_target, name) => String(name) }),
    '../../assets/logo.png': 'synthetic-logo',
    '../../components/common/Input': 'Input', '../../components/common/Button': 'Button',
    '../../components/common/Alert': 'Alert', '../../components/auth/AuthLayout': 'AuthLayout',
  };
  const component = load(file, { ...defaultImports, ...imports }, { React,
    document: { getElementById: () => ({ focus() {} }) }, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, ...globals,
  }, binding).default;
  const render = () => { cursor = 0; tree = component(props); return tree; };
  const nodes = (node = tree) => !node || typeof node !== 'object' ? []
    : [node, ...(node.props?.children || []).flat(Infinity).filter(child => child !== undefined).flatMap(child => nodes(child))];
  const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
    : (node?.props?.children || []).flat(Infinity).map(text).join('');
  const find = predicate => { const found = nodes().filter(predicate); if (found.length !== 1) throw new Error(`Expected one node; found ${found.length}`); return found[0]; };
  const input = (name, value) => { const n = find(n => n.props?.name === name || n.props?.accessibilityLabel === name);
    if (n.props.onChange) n.props.onChange({ target: { name: n.props.name, value } }); else n.props.onChangeText(value); render(); };
  render();
  return { render, nodes, find, text, input, effects: () => effects.splice(0).forEach(callback => callback()), state,
    submit: () => find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }),
    press: label => find(n => ['Button','button','TouchableOpacity'].includes(n.type) && text(n) === label).props.onPress?.()
      ?? find(n => ['Button','button','TouchableOpacity'].includes(n.type) && text(n) === label).props.onClick?.(),
  };
}
module.exports = { load, screen };
