import createVdom  from "./createVdom.js";
import  toRealDom  from "./convertVdom.js";
import updateDom from "./updateDom.js";

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

const oldVNode = createVdom("div",null,
	createVdom("span",{class:"item"},createVdom("span",{class:"item7"},"item7"),"item11"),
	createVdom("input",{disabled:true}),
	createVdom("button",{onClick:function(){console.log(111)}},"click"),
)

const root = document.querySelector('.root');
root.appendChild(toRealDom(oldVNode));


const newVNode = createVdom("div",{class:"root2"},
	createVdom("span",{id:"item2"},"item8","item9",createVdom("span",{class:"item10"},"item10")),
	createVdom("input",{disabled:false}),
	createVdom("span",{class:"item3"},"item3"),
	createVdom("button",{onClick:function(){console.log(222)}},"click"),
)
//这里只传递了一次也就意味着VDOM只允许有一个根节点<div></div>
//这里遇到一个很坑的地方，如果在root中<div class="root"></div>中间留有空格则会算有一个#text节点在VDOM的<div></div>之前
updateDom(root,oldVNode,newVNode,0);