const newProps = {class:'1',disabled:true}
const oldProps = {id:'2',disabled2:false}
/**
 * @param	{{}}oldProps 表示旧的props
 * @param {{}}newProps 表示新的props
 * @return {bealean} 当前props是否发生修改
 */
 const isPropsChanged = (oldProps,newProps) =>{
	// 类型不一致，props肯定发生变化
	if(typeof oldProps !== typeof newProps){
		return true;
	}
	
	// props为对象
	if(typeof oldProps === 'object' && typeof newProps === 'object') {
		const oldKeys = Object.keys(oldProps);
		const newKeys = Object.keys(newProps);
		
		//如果数目不同一定发生变化直接返回true
		if(oldKeys.length !== newKeys.length) {
			return true;
		}

		for(let i = 0;i < oldKeys.length;i++) {
			const key = oldKeys[i];
			if(oldProps[key] !== newProps[key]) {
				return true;
			}
		}

		return false;
	}

}

console.log(isPropsChanged(oldProps,newProps));


