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
