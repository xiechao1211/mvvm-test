import Mvvm from './mvvm/mvvm'
// @import('./index.css')
import './styles/main.less'
import './styles/index.css'

let mv = new Mvvm({
    el: "#app",
    data: ()=>{
        return {
            text : '我是测试',
            number: 23
        }
    },
    methods: {
        reset(){
            this.text = ''
        }
    }
})
