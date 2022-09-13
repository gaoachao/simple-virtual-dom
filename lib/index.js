import { jsx as _jsx } from "custom-jsx-library/jsx-runtime";
import { jsxs as _jsxs } from "custom-jsx-library/jsx-runtime";

const vdom = _jsxs("div", {
  className: "root",
  children: [_jsx("h1", {
    children: "hello,world"
  }), _jsx("div", {
    className: "son1",
    children: _jsx("h2", {
      children: "hello,world2"
    })
  })]
});