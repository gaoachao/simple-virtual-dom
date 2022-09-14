import createVdom  from "./createVdom.js";
import  toRealDom  from "./convertVdom.js";

// 使用JSX的语法写的vdom
// const vdomJSX = (
// 	<div>
// 		<span class="item">item</span>
// 		<input disabled={true}/>
// 	</div>
// )

// 1.经过babel翻译会转化成对象形式
const vdom = {
  type: "div",
  props: null,
  children: [
    {
      type: "span",
      props: {
        class: "item",
      },
      children: ["item"],
    },
    {
      type: "input",
      props: {
        disabled: true,
      },
      children: [],
    },
  ],
};

// 1.利用函数创建一个vdom
// function createVdom(type, props, ...children) {
// 	return {
// 			type,
// 			props,
// 			children,
// 	};
// }
const createdNode = createVdom("div",null,
	createVdom("span",{class:"item"},"item"),
	createVdom("input",{disabled:true})
)
const root = document.querySelector('.root');
root.appendChild(toRealDom(createdNode));