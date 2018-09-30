// 解析模板语法、指定
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
