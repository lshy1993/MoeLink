<template>
<div class="section selfbox grid-container clearfixbox">
    <div class="picture-container grid-30 clearfix">
        <div class="icon128">
            <img class="picture" src="static/images/head.jpg">
        </div>
    </div>
    <div class="grid-70 clearfix">
        <h1 class="greeting cn">
            <small class="prefix">哟，这里是</small>
            <span class="name no-wrap">幸运的路奇</span>
            <span class="face">(╯‵□′)╯︵┻━┻</span>
        </h1>
        <h1 class="greeting en">
            <small class="prefix">Hey, it's</small>
            <span class="no-wrap">MIAO</span>
        </h1>
        <h1 class="greeting jp">
            <small class="prefix">こんにちは、</small>
            <span class="name no-wrap">ミアオ
            <span class="face">de-su(&lt;ゝω·) ~☆</span>
            </span>
        </h1>
        <div class="labels">
            <a alt="home" class="label" href="//luckymiao.site">
                <i aria-hidden="true" class="fas fa-map-marker"></i>
                <span class="title">MIAO的小屋</span>
                <span class="link">//luckymiao.site</span>
            </a>
        </div>
        <div class="labels">
            <div alt="languages" class="label">
                <i aria-hidden="true" class="fas fa-language"></i>
                <span class="title">Language</span>
                <span class="content">中文 / 日本語 / English</span>
            </div>
        </div>
        <div class="labels">
            <div alt="education" class="label">
                <i aria-hidden="true" class="fas fa-university"></i>
                <span class="title">Becholar</span>
                <span class="content">ZJUT</span>
            </div>
            <div alt="education" class="label">
                <i aria-hidden="true" class="fas fa-university"></i>
                <span class="title">Master</span>
                <span class="content">Osaka University</span>
            </div>
            <div alt="education" class="label">
                <i aria-hidden="true" class="fas fa-university"></i>
                <span class="title">current</span>
                <span class="content">Osaka University</span>
            </div>
        </div>
        <div class="labels">
            <div alt="browser" class="label">
                <i aria-hidden="true" class="fab fa-chrome"></i>
                <span class="content">Stabel</span>
            </div>
            <div alt="editor" class="label">
                <i aria-hidden="true" class="far fa-keyboard"></i>
                <span class="content">Visual Studio</span>
            </div>
            <div alt="editor" class="label">
                <i aria-hidden="true" class="far fa-keyboard"></i>
                <span class="content">VS Code</span>
            </div>
            <div alt="editor" class="label">
                <i aria-hidden="true" class="far fa-keyboard"></i>
                <span class="content">Sublime 3</span>
            </div>
            <div alt="spaces or tabs" class="label">
                <i aria-hidden="true" class="fas fa-i-cursor"></i>
                <span class="content">Tabs(exc. Python)</span>
            </div>
        </div>
        <div class="labels">
            <div alt="platforms" class="label">
                <i aria-hidden="true" class="fab fa-windows"></i>
                <span class="content">10</span>
            </div>
            <div alt="platforms" class="label">
                <i aria-hidden="true" class="fab fa-linux"></i>
                <span class="content">ubuntu 16.4</span>
            </div>
            <div alt="platforms" class="label">
                <i aria-hidden="true" class="fab fa-linux"></i>
                <span class="content">CentOs 7.5</span>
            </div>
            <div alt="platforms" class="label">
                <i aria-hidden="true" class="fab fa-apple"></i>
                <span class="content">-</span>
            </div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'AboutHeader',
    data(){
        return {
            
        }
    }
}
</script>

<style lang="scss">
    // .header {
    //     background: #b5a191;
    //     padding-bottom: 1.6em;
    // }
</style>

