# VDOM

> 一个手写的VDOM类库

## 使用babel转换jsx代码

> 目前实现jsx到js的转换不需要完全依赖react的库，只需要用babel的新插件

### 配置环境

```shell
yarn init
yarn add -D @babel/cli @babel/core @babel/plugin-transform-react-jxs
```

### 运行babel

```shell
./node_modules/.bin/babel src --out-dir lib
```

## createVdom

```javascript
// 1.利用函数创建一个vdom，传入三个参数
const createVdom = (type, props, ...children) =>{
	return {
			type,
			props,
			children,
	};
}
export default createVdom;
```

## convertVdom

- `isCustomProp`：对`prop`的判断
- `isEventProp`：对事件回调属性的判断
- `extractEventName`：处理事件回调属性的`key`
- `setProp`：设置属性
- `toRealDom`：转化成真实`dom`的主函数

```javascript
// 2.将虚拟dom转化成真实dom
/*关于 isCustomProp 函数:
		有一类属性是我们的自定义属性，例如主流框架中的组件间的状态传递，
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
```

## updateDom

- `updateDom`：更新DOM的主函数
- `isNodeChanged`：来判断节点是否改变
- `isPropsChanged`：来判断属性值是否改变

```javascript
import toRealDom from "./convertVdom.js";
/**
 * @param {}$parent 表示挂载的父节点
 * @param	{}oldVnode 表示旧的节点
 * @param {}newNode 表示新的节点
 * @param {number} index 表示当前更新第几子节点，默认为0
 * @return
 */
const updateDom = ($parent, oldVNode, newVNode, index) => {
  // 当前索引的真实DOM为传入的父节点的
  const $currentDom = $parent.childNodes[index];
  // 先考虑新旧VDOM的类型变化
  // 没有旧的节点，添加新的节点
  if (!oldVNode) {
    return $parent.appendChild(toRealDom(newVNode));
  }

  // 没有新的节点，删去旧的RDOM
  if (!newVNode) {
    return $parent.removeChild($currentDom);
  }

  // 都是文本节点，都没有发生变化
  if (typeof oldVNode === "string" && typeof newVNode === "string" && oldVNode === newVNode) {
      return;
  }

  if (isNodeChanged(oldVNode, newVNode)) {
    return $parent.replaceChild(toRealDom(newVNode), $currentDom);
  }

  const oldProps = oldVNode.props || {};
  const newProps = newVNode.props || {};

  // 在考虑新旧节点上props的变化
  if (isPropsChanged(oldProps, newProps)) {
    const oldPropsKeys = Object.keys(oldProps);
    const newPropsKeys = Object.keys(newProps);

    // 如果新节点没有属性，把旧的节点的属性清除掉
    if (newPropsKeys.length === 0) {
      oldPropsKeys.forEach((propKey) => {
        removeProp($currentDom, propKey, oldProps[propKey]);
      });
    } else {
      const allPropsKeys = new Set([...oldPropsKeys, ...newPropsKeys]);
      allPropsKeys.forEach((propKey) => {
        if (!newProps[propKey]) {
          return removeProp($currentDom, propKey, oldProps[propKey]);
        }
        if (newProps[propKey] !== oldProps[propKey]) {
          return setProp($currentDom, propKey, newProps[propKey]);
        }
      });
    }
  }

  // 递归处理子节点
  if (
    (oldVNode.children && oldVNode.children.length) ||
    (newVNode.children && newVNode.children.length)
  ) {
    for (
      let i = 0;
      i < oldVNode.children.length || i < newVNode.children.length;
      i++
    ) {
      updateDom($currentDom, oldVNode.children[i], newVNode.children[i], i);
    }
  }
};

/**
 * @param	{}oldVnode 表示旧的节点
 * @param {}newNode 表示新的节点
 * @return {bealean} 当前节点是否发生修改
 */
const isNodeChanged = (oldVNode, newVNode) => {
  //一个是textNode(string)，一个是element(object)
  if (typeof oldVNode !== typeof newVNode) {
    return true;
  }

  //都是textNode(string) 则需比较文本是否发生改变
  if (typeof oldVNode === "string" && typeof newVNode === "string") {
    return oldVNode !== newVNode;
  }

  //都是element节点，比较节点类型是否发生改变
  if (typeof oldVNode === "object" && typeof newVNode === "object") {
    return oldVNode.type !== newVNode.type;
  }
};

/**
 * @param	{}oldProps 表示旧的props
 * @param {}newProps 表示新的props
 * @return {bealean} 当前props是否发生修改
 */
const isPropsChanged = (oldProps, newProps) => {
  // 类型不一致，props肯定发生变化
  if (typeof oldProps !== typeof newProps) {
    return true;
  }

  // props为对象
  if (typeof oldProps === "object" && typeof newProps === "object") {
    const oldKeys = Object.keys(oldProps);
    const newKeys = Object.keys(newProps);

    //如果数目不同一定发生变化直接返回true
    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    for (let i = 0; i < oldKeys.length; i++) {
      const key = oldKeys[i];
      // 如果key也发生改变了那就不能做到一一对应，newProps[key] === undefined
      if (oldProps[key] !== newProps[key]) {
        return true;
      }
    }
    return false;
  }
  return false;
};

// removeProp 与 setProp 相对应
const isCustomProp = (name) => {
  /* 这里需要对prop进行判断 */
  return false;
};
//判断是否有事件回调属性
const isEventProp = (name) => {
  return /^on/.test(name);
};
//去掉on，在JSX中还要转化成小写
const extractEventName = (name) => {
  return name.slice(2).toLowerCase();
};
const removeProp = ($target, name, value) => {
  if (isCustomProp(name)) {
    return;
  } else if (name === "className") {
    return $target.removeAttribute("class");
  } else if (isEventProp(name)) {
    return $target.removeEventListener(extractEventName(name), value);
  } else if (typeof value === "boolean") {
    $target.removeAttribute(name);
    $target[name] = false;
  } else {
    $target.removeAttribute(name);
  }
};

const setProp = ($target, name, value) => {
  if (isCustomProp(name)) {
    return;
    //主要针对jsx生成虚拟DOM
  } else if (name === "className") {
    return $target.setAttribute("class", value);
  } else if (isEventProp(name)) {
    return $target.addEventListener(extractEventName(name), value);
  } else if (typeof value === "boolean") {
    if (value) {
      $target.setAttribute(name, value);
    }
    //如果value是false的话真实dom没有必要加上这个属性
    $target[name] = value;
  } else {
    $target.setAttribute(name, value);
  }
};

export default updateDom;
```

