import {sleep} from '../utils'
import Dep from './dep'

class Observer {
    constructor(data){
        this.data = data
        this.walk(data)
        this.target = null
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
        if(typeof value === 'object'){
            return observer(value)
        }
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: ()=>{
                if (Dep.target) {
                    dep.addSub(Dep.target)
                }
                console.log(dep)
                return value
            },
            set: (newVal)=>{
                if(value === newVal){
                    return
                }
                console.log('哈哈哈。监听到值变化了',value,'>',newVal);
                value = newVal
                // 数据发生变化，主动通知
                dep.notify()
                console.log(dep)
            }
        })
    }
}

// 监听数据
function observer(value){
    if(!value || typeof value !=='object'){
        return
    }
    return new Observer(value)
}

export default observer