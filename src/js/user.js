import Func from './func';

class User {
    constructor(){

        this.info = {
            uid:-1,
            nickname:"",
            email:"example@adress.com",
            group:-1,
            regtime:"",
            logintime:"",
            topicnum:0,
            replynum:0,
        };
        this.logined = false;
        console.log('user init');
    }

    Init(data){       
        // this = data; 
        for(var key in data){
            this.info[key] = data[key];
            //this.$set(this,key,data[key]);
        }
        this.logined = true;
    }

    Logout(){
        this.info = {
            uid:-1,
            nickname:"",
            email:"",
            group:-1,
            regtime:"",
            logintime:"",
            topicnum:0,
            replynum:0,
        };
        this.logined = false;
    }

    isAdmin(){
        return this.info.group >= 100;
    }

    avatarUrl(){
        if(!this.logined){
            return "";
        }
        if(!this.info.email){
            return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
        }
        let hash = Func.md5(this.info.email);
        return "https://www.gravatar.com/avatar/"+hash;
    }
    
}
// var my = new User();

export default User;