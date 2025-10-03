<template>
<div id="infoContent">
    <div id="topBandImage">
        <img src="../../assets/still_unit_107731.png" />
    </div>
    <div class="insetContent">
        <div id="topContent">
            <div id="leftLogo" style="float: left;">MoeLink</div>
            <div id="rightLogo" class="clickable" @click="userLogined?logOut():showLoginBox()">
                <span class="naviTxt">{{ userLogined?"logout":"login" }}</span>
            </div>
        </div>
        <div id="mainContent">
            <div id="mainSearchBar">
                <input type="text-box">
                <router-link id="submitButton" to="/res">GO</router-link>
            </div>
            <div id="bottomBox">
                <div id="tabBox" class="shadowBox">
                    <div>
                        <div class="tabDiv" v-for="j in 5" :key="'tab'+j">{{ j }}</div>
                    </div>
                    <div id="tabContent">aaaaa</div>
                </div>
                <div id="broadBox" class="shadowBox">
                    <span>公告</span>
                    <div id="cvBox">
                        <img src="../../assets/still_unit_100231.png"/>
                    </div>
                    <ul>
                        <li v-for="i in 5" :key="'a'+i">{{ i }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div id="siteFooter">
        <div class="insetContent">
            COPY right
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'HelloWorld',
    data(){
        return {

        }
    },
    computed:{
        userLogined(){
            return this.User.logined;
        },
    },
    methods:{
        loginDone(){
            console.log('done');
        },
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
#infoContent{
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
#topBandImage{
    position: fixed;
    top: 0;
    width: 100%;
    height: 50%;
    overflow: hidden;
    z-index: -1;
    opacity: 0.9;

    img{
        height: auto;
    }
}
#siteFooter{
    /* position: fixed;
    bottom: 0;
    left: 0;
    right: 0; */
    width: 100%;
    height: 100px;
    background: rgba(0,0,0,.2);
}

.insetContent{
    width: 960px;
    margin: 0 auto;
}

#topContent
{
    width: 100%;
    height: 50px;
    line-height: 50px;
    
    #leftLogo{
        color: black;
        font-size: 48px;
    }
    #rightLogo{
        color: white;
    }
    
    //background: white;
}

#mainContent{
    margin-top: 150px;
    margin-bottom: 50px;
    height: auto;
}
#mainSearchBar{
    border-radius: 20px;
    width: 600px;
    height: 40px;
    background: white;
    margin: 0 auto;
}
#mainSearchBar > input {
    display: inline-block;
    width: 500px;
    line-height: 30px;
}
#submitButton {
    display: inline-block;
    width: 50px;
    line-height: 40px;
}
#bottomBox{
    width: 960px;
    height: 400px;
    margin-top: 10px;
}
.shadowBox{
    box-shadow: 0px 2px 2px rgba(0,0,0,0.4);
}
#tabBox{
    display: inline-block;
    width: 70%;
    height: 100%;
    vertical-align: top;
    text-align: left;
    background: white;
}
.tabDiv{
    display: inline-block;
    padding: 5px 10px;
    line-height: 40px;
    /*background: white;*/
}
.tabDiv:hover{
    user-select: none;
    color: skyblue;
}
#tabContent{
    padding: 10px;
}
#broadBox{
    display: inline-block;
    width: 30%;
    height: 100%;
    vertical-align: top;

    background: skyblue;
}
#cvBox{
    height: 160px;
    overflow: hidden;
}

h3 {
    margin: 40px 0 0;
}
ul {
    list-style-type: none;
    padding: 0;
    text-align: left;
}
li {
    display: block;
    margin: 20px 10px;
}
a {
    color: #42b983;
}
</style>
