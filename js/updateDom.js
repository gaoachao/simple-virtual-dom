import toRealDom from "./convertVdom.js";

/**
 * @param {}$parent 表示挂载的父节点
 * @param	{}oldVnode 表示旧的节点
 * @param {}newNode 表示新的节点
 * @param {number} index 表示当前更新第几子节点，默认为0
 * @return
 */
const updateDom = ($parent, oldVNode, newVNode) => {
  const $currentDom = oldVNode.$el;

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
  if (
    typeof oldVNode === "string" &&
    typeof newVNode === "string" &&
    oldVNode === newVNode
  ) {
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
    // 没有实现顺序diff
    // for (
    //   let i = 0;
    //   i < oldVNode.children.length || i < newVNode.children.length;
    //   i++
    // ) {
    //   updateDom($currentDom, oldVNode.children[i], newVNode.children[i], i);
    // }

    let oldStartIdx = 0;
    let oldEndIdx = oldVNode.children.length - 1;
    let oldStartVnode = oldVNode.children[oldStartIdx];
    let oldEndVnode = oldVNode.children[oldEndIdx];

    let newStartIdx = 0;
    let newEndIdx = newVNode.children.length - 1;
    let newStartVnode = newVNode.children[newStartIdx];
    let newEndVnode = newVNode.children[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVnode) {
        oldStartVnode = oldVNode.children[++oldStartIdx];
      } else if (!oldEndVnode) {
        oldEndVnode = oldVNode.children[--oldEndIdx];
      } else if (!newStartVnode) {
        newStartVnode = newVNode.children[++newStartIdx];
      } else if (!newEndVnode) {
        newEndVnode = newVNode.children[--newEndIdx];
      } else if (isSameNode(oldStartVnode, newStartVnode)) {
        // 如果两个头节点是同一个节点，则更新其子节点，继续向后遍历
        updateDom($currentDom, oldStartVnode, newStartVnode);
        oldStartVnode = oldVNode.children[++oldStartIdx];
        newStartVnode = newVNode.children[++newStartIdx];
      } else if (isSameNode(oldEndVnode, newStartVnode)) {
        // 如果两个尾节点是同一个节点，则更新其子节点，继续向前遍历
        updateDom($currentDom, oldEndVnode, newEndVnode);
        oldEndVnode = oldVNode.children[--oldEndIdx];
        newEndVnode = newVNode.children[--newEndIdx];
      } else if (isSameNode(oldStartVnode, newEndVnode)) {
        // 如果旧的头节点和新的尾节点相同，可以通过移动节点来复用DOM
        // 先继续更新子节点，然后把旧的头结点（即新的尾节点）加入到最后面
        updateDom(oldVNode.$el, oldStartVnode, newEndVnode);
        oldVNode.$el.insertBefore(
          oldStartVnode.$el,
          oldEndVnode.$el.nextSibling
        );
        oldStartVnode = oldVNode.children[++oldStartIdx];
        newEndVnode = newVNode.children[--newEndIdx];
      } else if (isSameNode(oldEndVnode, newStartVnode)) {
        // 原理同上
        updateDom(oldVNode.$el, oldEndVnode, newStartVnode);
        oldVNode.$el.insertBefore(oldEndVnode.$el, oldStartVnode.$el);
        oldEndVnode = oldVNode.children[--oldEndIdx];
        newStartVnode = newVNode.children[++newStartIdx];
      }
      if (oldStartIdx > oldEndIdx) {
        for (let i = newStartIdx; i <= newEndIdx; i++) {
          if (newVNode.children[i]) {
            oldVNode.$el.insertBefore(
              toRealDom(newVNode.children[i]),
              newVNode.children[newEndIdx + 1]
                ? newVNode.children[newEndIdx + 1].$el
                : null
            );
          }
        }
      } else if (newStartIdx > newEndIdx) {
        // 当新节点头索引大于新节点尾索引，表示新节点组已经遍历完了，直接删除旧的未遍历到的节点，这些节点不再需要
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
          if (oldVNode.children[i]) {
            oldVNode.$el.removeChild(oldVNode.children[i].$el);
          }
        }
      }
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

//对比key
const isSameNode = (oldNode, newNode) => {
  return oldNode.props["key"] === newNode.props["key"];
};
