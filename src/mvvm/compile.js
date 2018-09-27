// 解析模板语法、指定
import Watcher from './watcher'
import Dep from './dep'

class Compile {
    constructor(el, vm){
        // vm mvvm实例
        this.$vm = vm
        this.$el = this.isElementNode(el) ? el : document.querySelector(el)
        // this.compileNodes(document.querySelector(el))
        if(this.$el){
            this.$fragment = this.node2Fragment(this.$el)
            this.init()
            this.$el.appendChild(this.$fragment)
        }
    }
    init(){
        this.compileFragment(this.$fragment)
    }
    // 遍历转换完成的html片段(fragment)
    compileFragment(fragment){
        let childNodes = fragment.childNodes;
        for (const node of childNodes) {
            let text = node.textContent
            let reg = /\{\{(.*)\}\}/
            
            if(this.isElementNode(node)){
                this.compileNode(node)
            }else if(this.isTextNode(node) && reg.test(text)){
                // 正则值 RegExp.$1
                console.log(RegExp.$1)
            }
        }
    }
    compileNode(node){
        let nodeAttrs = node.attributes
        for (const attr of nodeAttrs) {
            let attrName = attr.name
            if(this.isDirective(attrName)){
                let directiveValue = attr.value
                let directiveName = attrName.substring(2)
                console.log(attrName)
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
        return attrname.indexOf('v-') === 0 || attrname.indexOf('@') === 0
    }
    isEventDirective(directiveName){
        // let reg = /$@\/
        directiveName.indexOf('@') === 0
    }
    // 判断是否是node类型 div/p 等html节点
    isElementNode(node) {
        return node.nodeType == 1;
    }
    // 判断是否是文本类型 {{}}
    isTextNode(node) {
        return node.nodeType == 3;
    }

}

const compileUtils = {

}


export default Compile
