#### 基于webpack4制作的带babel、less编译、webpack热更新的demo
```bash
# 安装依赖
yarn
# 启动本地服务
yarn start
# build
yarn run prod
```

> 在写了很多的vue项目之后，就比较想去了解vue的实现方式，因为现在的前端框架主要是Vue/React/Angular，除了React之外都可以实现数据的双向绑定，React也可以稍微做多一点，自己实现，关键问题在是数据与页面(模板)的绑定、同步数据更新/页面更新。
> 类vue的mvvm框架叫做 模板(model)-视图(view)-视图模板(viewmodel)，核心就是将view耦合model，并且在model更新的时候操作view中的dom变化

#### mvvm框架流程解析
本文章的代码参考了[DMQ/mvvm](https://github.com/DMQ/mvvm)
vue采用了数据劫持的方式(observer)来进行视图-模板的绑定更新，
{% asset_img mvvm.png mvvm %}
图片来自[DMQ/mvvm](https://github.com/DMQ/mvvm)
流程：
- observer：数据监听，由observer对数据模型使用[Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)对数据的get、set方法进行劫持，设置数据时通知订阅者(watcher)更新，获取数据时绑定订阅者，
- compile：模板/指令编译器，将html文件中的指令(v-model,@clickj,&#123;&#123;&#125;&#125;)等特定规则的字符串解析成mvvm中的数据，并且将其添加为一个观察者，同时执行具体的dom更新、事件绑定等
- watcher：订阅者，模板/数据观察者，一旦观察到了数据的变动，则进行数据更新
- dep：消息订阅器,连接compile与watcher，在数据劫持中绑定watcher

#### mvvm框架页面示例
以一个简单的页面示范mvvm框架的实现
实现的效果：
{% asset_img demo.gif demo %}
html文件
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>webpack4 demo</title>
</head>
<body>
    <div class="main" id="app">
        <input type="text"  v-model="str">
        <div style="color:red">{{str}}</div>
        <!-- <input type="text" v-model="child.childData"> -->
        <div style="color: blue" v-text="child.childData"></div>
        <div style="color: blue" v-text="text"></div>
        <!-- {{str}} -->
        <input type="button" value="清除"  @click="clear">
        <input type="button" value="设置子对象" @click="setChild">
    </div>
</body>
</html>
```
js文件
```js
import Mvvm from './mvvm'

let mv = new Mvvm({
    el: "#app",
    data: ()=>{
        return {
            str : '我是测试',
            someStr: '别的内容',
            child: {
                childData:'我是子对象',
            },
            text: '我是text'

        }
    },
    methods: {
        setChild(){
            console.log('子对象的事件绑定')
            this.child.childData = Math.round((Math.random() * 5 * 100))/100
        },
        clear(){
            console.log('绑定事件成功')
            this.str = ''
        }
    }
})
```
<!--more-->
以上的示例，我们要实现的就是将v-text、v-model，&#123;&#123;&#125;&#125;@click与data里对应的text、str、child.childData和methods里的方法进行绑定与更新。
#### mvvm框架的实现
项目基于之前的[webpack4-demo](https://github.com/xiechao1211/webpack4-demo)实现，src目录下新建mvvm目录，并且新建以下文件：index.js,compile.js,dep.js,observer.js,watcher.js。

observer.js 数据监听器
```js
// 实现的关键点在defineReactive方法
class Observer {
    constructor(data){
        this.data = data
        this.walk(this.data)
    }
    walk(obj){
        const keys = Object.keys(obj)
        // 对data的所有属性进行遍历，
        keys.map(key=>{
            this.defineReactive(obj,key,obj[key])
        })
    }
    // 给obj添加defineProperty属性，可响应式的取值
    defineReactive(obj, key, value){
        // 子对象继续进行数据劫持
        if(typeof value === 'object'){
            return observer(value)
        }
        const dep = new Dep()
        let childObj = observer(value)
        Object.defineProperty(obj, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: ()=>{
                if (Dep.target) {
                    dep.depend()
                    // dep.addSub(Dep.target)
                }
                return value
            },
            set: (newVal)=>{
                if(value === newVal){
                    return
                }
                console.log('监听到值变化了:',value,'=>',newVal);
                value = newVal
                childObj = observer(newVal)
                // 数据发生变化，主动通知
                dep.notify()
            }
        })
    }
}
```
dep.js 消息订阅器
```js
// 订阅器需要实现增加订阅、移除订阅、通知订阅者
// 在这里需要注意，要添加一个 全局变量 Dep.target 作为订阅者的临时存储
let uid = 0;
// 消息订阅器
class Dep {
    constructor(){
        this.id = uid++;
        // 初始化订阅器
        this.subs = []
    }
    // 增加订阅
    addSub(sub){
        this.subs.push(sub)
    }
    // 移除订阅
    removeSub(sub){
        let index = this.subs.indexOf(sub)
        if(!index === -1){
            this.subs.splice(index,1)
        }
    }
    depend(){
        // 将相关的watcher添加到subs中（将暂时的watch添加到subs）addDep 为watcher的方法
        Dep.target.addDep(this);
    }
    // 订阅对象(watcher)更新
    notify(){
        this.subs.map(sub => {
            sub.update()
        })
    }
}
// 订阅器增加全局属性 target，暂存watcher
Dep.target = null
export default Dep
```
watcher.js 订阅者
```js
import Dep from './dep'

class Watcher{
    constructor(vm, directiveValue, cb){
        this.vm = vm
        this.directiveValue = directiveValue
        this.cb =cb
        this.depIds = {}
        // 触发属性的getter
        this.value = this.get()
    }

    update(){
        let value = this.get()
        let oldValue = this.value
        if(value !== oldValue){
            this.value = value
            // call方法 传入当前的watcher的vm作为回调的作用域
            this.cb.call(this.vm, value, oldValue)
        }
    }
    addDep(dep){
        // 如果当前的depid在已有的depids不存在，则添加订阅
        if(!this.depIds.hasOwnProperty(dep.id)){
            dep.addSub(this)
            this.depIds[dep.id] = dep
        }
    }
    get(){
        Dep.target = this
        // let value = this.vm[this.directiveValue] //触发observer的get，从而触发订阅
        let value = this.getVal(this.vm, this.directiveValue)
        Dep.target = null
        return value
    }
    // child.childData的形式也能获取数据
    getVal(vm, directiveValue){
        // 迭代获取数据，可获取子对象
        let value = vm;
        directiveValue = directiveValue.split('.')
        directiveValue.map(item=>{
            value = value[item]
        })
        return value
    }
}

export default Watcher
```
compile.js 模板/指令解析器
```js
// 主要实现点在与将dom对象fragment化，解析成html片段的形式进行再次解析，再区分的指令与文本节点，再做不同的操作，添加事件监听、更新文本、更新html、添加input监听(v-model)
import Watcher from './watcher'

class Compile {
    constructor(el, vm){
        // vm mvvm实例
        this.vm = vm
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        if(this.el){
            this.$fragment = this.node2Fragment(this.el)
            this.init()
            this.el.appendChild(this.$fragment)
        }
    }
    init(){
        this.compileFragment(this.$fragment)
    }
    // 遍历转换完成的html片段(fragment)
    compileFragment(fragment){
        let childNodes = fragment.childNodes

        for (const node of childNodes) {
            let text = node.textContent
            // {{}} 格式的文本
            let reg = /\{\{(.*)\}\}/

            if(this.isElementNode(node)){
                this.compileNode(node)
            }else if(this.isTextNode(node) && reg.test(text)){
                // 正则值 RegExp.$1
                let directiveValue = RegExp.$1
                compileUtils.text(this.vm, node, directiveValue)
            }
            // 递归循环子节点
            if(node.childNodes && node.childNodes.length){
                this.compileFragment(node)
            }
        }
    }
    compileNode(node){
        let nodeAttrs = node.attributes
        for (const attr of nodeAttrs) {
            let attrName = attr.name
            if(this.isDirective(attrName)){
                // 指令值
                let directiveValue = attr.value
                // 指令名称
                let directiveName = ''
                // 如果是动作指令 @开头的
                if(this.isEventDirective(attrName)){
                    directiveName = attrName.substring(1)
                    compileUtils.eventHandler(this.vm, node, directiveValue, directiveName)
                }else{
                    directiveName = attrName.substring(2)
                    compileUtils[directiveName] && compileUtils[directiveName](this.vm, node,directiveValue,directiveName)
                }
                node.removeAttribute(attrName)

            }
        }
    }
    // node节点转换成html片段
    node2Fragment(el){
        let fragment = document.createDocumentFragment()
        let child
        while (child = el.firstChild){
            fragment.appendChild(child)
        }

        return fragment
    }
    // TODO 待使用正则匹配
    // 判断是否是指令属性
    isDirective(attrname){
        // v-开头 或者 @开头
        let reg = /^v-|^@/
        return reg.test(attrname)
        // return attrname.indexOf('v-') === 0 || attrname.indexOf('@') === 0
    }
    isEventDirective(directiveName){
        let reg = /^@/
        return reg.test(directiveName)
    }
    // 判断是否是node类型 div/p 等html节点
    isElementNode(node) {
        return node.nodeType === 1;
    }
    // 判断是否是文本类型 {{}}
    isTextNode(node) {
        return node.nodeType === 3;
    }

}

const compileUtils = {
    /**参数注释
     * vm: vm实例
     * node: html节点
     * directiveValue：@click="clean" 里的clean 也就是执行的函数名称
     * directiveName：@click 里的click，也就是事件名称
     */
    // vm实例，node html节点，directiveValue: @click 的click，
    eventHandler(vm, node, directiveValue, directiveName){
        let method = vm.methods && vm.methods[directiveValue]
        if(method && directiveName){
            // true 捕获（由上倒下） false 冒泡（由下到上）
            node.addEventListener(directiveName, method.bind(vm), false)
        }
    },
    /**参数注释
     * vm: vm实例
     * node: html节点
     * directiveValue：{{str}} 里的str
     * directiveName：@click 里的click，也就是事件名称
     */
    text(vm, node, directiveValue, directiveName){
        // 第一次初始化
        this.updateText(node,this.getVal(vm,directiveValue))
        // 实例化订阅并添加watcher
        new Watcher(vm, directiveValue, (value, oldValue)=>{
            this.updateText(node,value)
        })
    },
    html(vm, node, directiveValue){
        this.updateHtml(node,this.getVal(vm,directiveValue))
        new Watcher(vm, directiveValue, (value, oldValue)=>{
            this.updateHtml(node,value)
        })
    },
    model(vm, node, directiveValue){
        let modelValue = this.getVal(vm,directiveValue)
        this.updateModel(node, modelValue)
        new Watcher(vm, directiveValue, (value, oldValue)=>{
            this.updateModel(node, value)
        })
        node.addEventListener('input', (e)=>{
            let newValue = e.target.value
            if(newValue === modelValue){
                return
            }
            // vm[directiveValue] = newValue
            this.setVal(vm, directiveValue,newValue)
            modelValue = newValue
        })
    },
    updateText(node, value){
        node.textContent = typeof value === 'undefined' ? '' : value
    },
    updateHtml(node, value){
        node.innerHTML = typeof value === 'undefined' ? '' : value
    },
    updateModel(node, value){
        node.value = typeof value === 'undefined' ? '' : value
    },
    getVal(vm, directiveValue){
        // 迭代获取数据，可获取子对象数据
        let value = vm;
        directiveValue = directiveValue.split('.')
        directiveValue.map(item=>{
            value = value[item]
        })
        return value
    },
    setVal(vm, directiveValue,newValue){
        // 迭代设置数据，可设置子对象
        let value = vm
        directiveValue = directiveValue.split('.')
        directiveValue.map((item,index)=>{
            // 一直遍历到 directiveValue 的最后一个，比如[child,data]
            // 如果不是最后一个，那么就把新值赋给value，继续循环
            // 如果 directiveValue 不是子对象那么，就直接赋值
            if(index < directiveValue.length -1){
                value = value[item]
            }else{
                value[item] = newValue
            }
        })
    },
}

export default Compile
```
以上完成了4个单独组件的编写，下面还要对上面的几个模块进行整合，在index.js里实现他
index.js
```js
// 在这里生成 observer类、compile类，还要通过Object.defineProperty方法实现一个数据代理功能
import observer from './observer'
import Compile from './compile';
class Mvvm {
    constructor(options){
        this.options = options
        this.el = options.el
        this.data = options.data()
        this.methods = options.methods
        // 数据代理
        Object.keys(this.data).map(item=>{
            this.proxyData(item)
        })
        let ob = observer(this.data)
        this.compile = new Compile(this.el,this)
        // console.log(ob.data.text)
    }
    // 数据代理，this.str = this.data.str,也采用数据劫持的方式
    proxyData(key){
        Object.defineProperty(this,key,{
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: ()=>{
                return this.data[key]
            },
            set: (newValue)=>{
                this.data[key] = newValue
            }
        })
    }
}

export default Mvvm
```
这样就完成了非常简化版的mvvm框架，使用他见以上的示例代码
完整的代码见[mvvm](https://github.com/xiechao1211/webpack-mvvm)
