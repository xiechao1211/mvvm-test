class Watcher{
    constructor(node, type){
        this.node = node
        this.type = type
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
}

export default Watcher
