//  Watcher 作为订阅者
import Dep from './dep'
class Watcher{
    constructor(){
        this.depIds = {}
    }

    update(value){
        console.log(value)
        if(this.type === 'input'){
            this.node.value = value
        }else if(this.type === 'text'){
            console.log(value)
            this.node.nodeValue = value
        }
    }
    addDep(dep){
        // 如果当前的depid在已有的depids不存在，则添加订阅
        if(!this.depIds.hasOwnProperty(dep.id)){
            dep.addSub(this) 
            this.depIds[dep.id] = dep
        }
    }
    get(data, key){
        Dep.target = this
        let value = data[key] //出发observer的get，从而触发订阅
        return value
    }
}

export default Watcher
