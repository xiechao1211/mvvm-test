// Observer 数据监听器，能够对数据对象的所有属性进行监听，如有变动可拿到最新的值并通知订阅者，内部采用的Obiect.defineProperty的getter和setter来实现。
// complie指令解析器，它的作用对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定Observer和Complie的桥梁,能够订阅并收到每个属性变动的通知，执行指令绑定的相应的回调函数
// Watcher订阅者，作为连接Observer和Complie的桥梁,能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数。
// Dep消息订阅器，内部维护了一个数组，用来收集订阅者（watcher）,数据变动触发notify函数，再调用订阅者的update方法。
import observer from './observer'
import {sleep} from '../utils'
import Dep from './dep'
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
        // ob.data.text = '2222'



    }
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

