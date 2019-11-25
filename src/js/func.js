function ranBG(){
    let random = Math.floor(Math.random()*(80)+1001);
    let file='/static/images/still_unit_'+random+'31.png';
    return 'url('+file+')';
}

function GetApi(path){
    //var url = "https://api.luckymiao.site/"
    var url = "https://api.liantui.moe/"
    if(process.env.NODE_ENV == 'development'){
        url = "192.168.1.5:3000/"
    }
    return url + path;
}

export default {
    ranBG, GetApi
}