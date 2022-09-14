// 1.利用函数创建一个vdom
const createVdom = (type, props, ...children) =>{
	return {
			type,
			props,
			children,
	};
}

export default createVdom;