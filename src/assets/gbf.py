# -*- coding: UTF-8 -*-
import json

with open('gbf.json','r',encoding='utf-8') as f:
    jj = json.load(f)
    llist = []
    dic = {}
    for i in range(1,len(jj)):
        if(i % 2 == 1):
            dic['jp'] = jj[i]
        else:
            dic['en'] = jj[i]
            llist.append(dic)
            dic = {}
with open('gbf2.json','w',encoding='utf-8') as f:
    json.dump(llist,f,indent=4,ensure_ascii=False)

