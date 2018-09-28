//  Watcher 作为订阅者
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
        // console.log(value)
        // if(this.type === 'input'){
        //     this.node.value = value
        // }else if(this.type === 'text'){
        //     console.log(value)
        //     this.node.nodeValue = value
        // }
        let value = this.get()
        let oldValue = this.value
        if(value !== oldValue){
            this.value = value
            this.cb.call(this.vm, value,oldValue)
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
