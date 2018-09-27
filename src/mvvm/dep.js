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
    depand(){
        // 将相关的watcher添加到subs中（将暂时的watch添加到subs）addDep 为watcher的方法
        Dep.target.addDep(this);
    }
    // 订阅更新
    notify(){
        this.subs.map(sub => {
            sub.update()
        })
    }
}
// 订阅器增加全局属性 target，暂存watcher
Dep.target = null
export default Dep
