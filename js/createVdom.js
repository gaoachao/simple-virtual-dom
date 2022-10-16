// 1.利用函数创建一个vdom

let vKey = 0;
const createVdom = (type, props, ...children) => {
	return {
    type,
    props:{
			...props,
			'key':++vKey,
		},
		// 需要特别处理字符串VDOM
    children:children.map(child => {
			if(typeof child === 'string'){
				return {
					type:'textNode',
					prop:{'key':++vKey},
					children:[],
					text:child,
				};
			}
			return child;
		})
  };
};

export default createVdom;
