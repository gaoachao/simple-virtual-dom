// 2.将虚拟dom转化成真实dom

/*关于 isCustomProp 函数:
		还有一类属性是我们的自定义属性，例如主流框架中的组件间的状态传递，
		即通过props来进行传递的，我们并不希望这一类属性显示在 DOM 中，
		因此需要编写一个函数isCustomProp来检查这个属性是否是自定义属性，
		因为本文只是为了实现 Virtual DOM 的核心思想，为了方便，在本文中，这个函数直接返回false。
*/

const isCustomProp =(name)=>{
	/* 这里需要对prop进行判断 */
	return false;
}

//判断是否有事件回调属性
const isEventProp =(name)=> {
	return /^on/.test(name);
}

//去掉on，在JSX中还要转化成小写
const extractEventName =(name) =>{
	return name.slice(2).toLowerCase();
}

//给真实dom设置prop
const setProp =($target, name, value)=> {
	if (isCustomProp(name)) {
			return;
	//主要针对jsx生成虚拟DOM
	} else if (name === 'className') { 
			return $target.setAttribute('class', value);
	} else if (isEventProp(name)) {
			return $target.addEventListener(extractEventName(name), value);
	} else if (typeof value === 'boolean') {
			if (value) {
					$target.setAttribute(name, value);
			}
			//如果value是false的话真实dom没有必要加上这个属性
			$target[name] = value;
	} else {
			$target.setAttribute(name, value);
	}
}

const toRealDom = (vNode) =>{
	///$dom表示真实DOM
	let $dom;
	if (typeof vNode === 'string') {
		//如果vdom的类型是string而不是对象
			$dom = document.createTextNode(vNode);
	} else {
			$dom = document.createElement(vNode.type);
	}

	//处理虚拟DOM上的props
	if (vNode.props) {
			Object.keys(vNode.props).forEach(key => {
					setProp($dom, key, vNode.props[key]);
			});
	}

	//递归处理子节点，这里需要注意 空数组[]返回的是true 因此加上 vNode.children.length
	if (vNode.children && vNode.children.length) {
			vNode.children.forEach(childVdom => {
					const realChildDom = toRealDom(childVdom);
					$dom.appendChild(realChildDom);
			});
	}

	return $dom;
}

export default toRealDom;