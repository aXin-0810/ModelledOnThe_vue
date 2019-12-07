function lin(options){
	// 获取操作对象
	this.$options = options;
	// 获取data参数对象值
	this._data = this.$options.data || {};
	// 获取局域函数
	this._methods = this.$options.methods || {};
	// 代理data数据
	var data = this._data;
	// 代理局域函数
	var methods = this._methods;
	
	// 对data数据进行数据的递归劫持
	Observer(data);
	
	// this代理_data数据数据
	for(let key in data){
		Object.defineProperty(this,key,{
			configurable:true,
			enumberable:true,
			get:function(){
				return this._data[key];
			},
			set:function(newVal){
				this._data[key] = newVal;
			}
		})
	}
	
	// this代理局域函数
	for(let key in methods){
		this[key] = methods[key].bind(this);
	}
	
	// 模版编译
	compile(this.$options.el,this)
	
}
// 封装数据劫持
function Observer(data){
	// 遍历对象
	for(let key in data){
		// 获取属性值
		let val = data[key];
		let dep = new Dep();
		// 判断属性值是否为对象类型是否需要进一步递归
		objRecursion(val);
		// 进行数据的劫持操作
		Object.defineProperty(data,key,{
			// 设置可以被删除
			configurable:true,
			// 可以被枚举列出数据
			enumberable:true,
			// 设置获取回调
			get:function(){
				if (Dep.target) {
					// 注册订阅
				    dep.addSub(Dep.target);
				}
				return val;
			},
			// 设置修改赋值回调
			set:function(newVal){
				if(newVal === val){
					return;
				};
				val = newVal;
				// 用于判断新修改的值是否为对象，是对象做一个数据劫持
				objRecursion(val);
				// 遍历触发订阅回调
				dep.notify();
			}
		})
	}
}

// 判断参数是否为对象类型数据，是的话进行数据的递归劫持
function objRecursion(data){
	if (!data || typeof data !== 'object') {
	    return;
	}
	return new Observer(data);
} 



// 发布订阅模式
function Dep(){
	// 收集订阅信息
	this.subs = [];
}
// 注册订阅
Dep.prototype.addSub = function (sub) {
	this.subs.push(sub);
}
// 发布
Dep.prototype.notify = function () {
	// 遍历执行
	this.subs.forEach(function(sub){
		sub.update();
	});
}
// 
Dep.target = null;



// 监听器
function watcher (vm,exp,cb) {
	// 需要绑定的对象实例
	this.vm = vm;
	this.exp = exp;
	// 数据更新回调
	this.cb = cb;
	// 将实例赋值缓存自己
	Dep.target = this;
	// 获取对应数据以便强制触发get回调
	this.getVal();
	// 释放自己
	Dep.target = null;
}
watcher.prototype.update = function () {
	// 执行数据更新回调并且带上更新后的值
	this.cb(this.getVal());
}
watcher.prototype.getVal = function () {
	var val = this.vm;
	var kArr = this.exp.split('.');
	// 遍历获取对应数据（触发数据劫持中的get回调，实现注册订阅）
	kArr.forEach(function(key){
		val = val[key];
	});
	// 返回更新值
	return val;
}



// 节点元素编译
function compile(el,that){
	// 获取元素节点
	that.$el = document.querySelector(el);
	// 创建一个新的空白的文档片段
	let fragment = document.createDocumentFragment();
	
	// 转移元素节点到内存文档片段中
	while(child = that.$el.firstChild){
		fragment.appendChild(child)
	}
	
	// 递归遍历节点元素（并且匹配替换）
	replace(fragment);
	
	// 将文档片段赋值回去
	that.$el.appendChild(fragment);
	
	function replace(fragment){
		// 递归遍历节点元素（并且匹配替换）
		Array.from(fragment.childNodes).forEach(function(item){
			// 获取文本内容
			let text = item.textContent;
			// 双花括号匹配
			let doubleCurlyBraces = /\{\{(.*)\}\}/;
			
			// 文本渲染
			if(item.nodeType === 3 && doubleCurlyBraces.test(text)){
				let val = that;
				let exp = RegExp.$1;
				
				// 遍历获取对应数据
				exp.split('.').forEach(function(key){
					val = val[key];
				});
				
				// 赋值给节点
				item.textContent = text.replace( doubleCurlyBraces, val );
				
				// 订阅监听数据更新时更新视图
				new watcher(that, exp, function(newVal){
					item.textContent = text.replace( doubleCurlyBraces, newVal );
				});
			}
			
			// 指令操作
			if(item.nodeType === 1){
				let nodeAttrs = item.attributes;
				Array.from(nodeAttrs).forEach(function(attr){
					
					let attrName = attr.name;
					let attrVal = attr.value;
					
					// 点击事件绑定
					if(attrName.indexOf('l-on:click') == 0 || attrName.indexOf('@click') == 0){
						// 赋值事件函数并且把对象实例绑定回去
						item.onclick = that[attrVal];
					}else
					
					// 双向数据绑定指令
					if(attrName.indexOf('l-model') == 0){
						item.value = that[attrVal];
						
						// 订阅监听数据更新时更新视图
						new watcher(that, attrVal, function(newVal){
							item.value = newVal
						});
						
						// 监听视图改变时数据改变
						item.addEventListener('input',function(e){
							that[attrVal] = e.target.value;
						});
					}else
					
					//
					if(attrName.indexOf('l-for') == 0){
						
					}else
					
					//
					if(attrName.indexOf('l-show') == 0){
						
					}else
					
					//
					if(attrName.indexOf('l-if') == 0){
						
					}else
					
					// 
					if(attrName.indexOf(':class') == 0){
						
					}else
					
					//
					if(attrName.indexOf(':style') == 0){
						
					}
					
				})
			}
			
			// 递归
			if(item.childNodes){
				replace(item);
			}
			
		})
	}
}