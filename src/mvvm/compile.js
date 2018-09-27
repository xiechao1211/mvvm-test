// 解析模板语法、指定
import Watcher from './watcher'
import Dep from './dep'

class Compile {
    constructor(el, vm){
        // this.$el = document.querySelector(el)
        this.compileNodes(document.querySelector(el))
    }
    compileNodes(node){
        const nodes = node.childNodes
        //  for of 循环nodes
        for (const node of nodes) {
            if(node.nodeType === 1){
                // console.log(111)
            }
            if(node.nodeType === 3){
                const reg = /\{\{(.*)\}\}/
                const match = node.nodeValue.match(reg)
                if(match){
                    const name = match[1].trim()
                    Dep.target = new Watcher(node, 'text')
                    // this.target = new Watcher(node, 'text')
                    // Dep.target = this.target
                    // console.log(Dep.target)
                    this[name]
                }
            }
        }
    }
}


export default Compile
