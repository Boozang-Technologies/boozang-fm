var _CtrlDriver={
  bd:{"{":"}","[":"]","(":")","'":"'",'"':'"','`':'`'},
  _tmpValue:0,
  _curDomItem:null,
  _curSignedList:[],
  _updateUIList:[],
  _cleanList:new Set(),
  _refershDataList:[],
  _arrayUIList:[],
  _afterUpdateFunList:[],
  _proxyTypes:[Location,Object,Array],
  _delaySet:function(d,k,v){
    setTimeout(()=>{
      d[k]=v
    },10)
  },
  _updateObj:function(o,kk,v){
    if(kk.constructor!=Array){
      kk=[kk]
    }
    kk.forEach(k=>{
      o[k]=0
      if(v===undefined){
        delete o[k]
      }else{
        o[k]=v
      }
    })
  },
  _refreshDom:function(_dom){
    if(_dom){
      if(_dom.constructor==String){
        _dom=$(_dom)[0]
        if(!_dom){
          return
        }
      }

      let p=_dom.parentElement,
      pp=_dom.previousSibling;
      if(p){
        _dom.remove()
        _dom=_CtrlDriver._drawView(_dom._ctrl,_dom._data,_dom._viewDef,p,pp)
        if(!pp&&p.firstChild!=_dom){
          _dom.parentElement.insertBefore(_dom,_dom.parentElement.firstChild)
        }
      }
    }
  },
  _refreshData:function(d,k,_fun,vv){
    // _CtrlDriver._refershDataList=_CtrlDriver._refershDataList.filter(x=>Date.now()-x._time<100)
    // if(_CtrlDriver._refershDataList.find(x=>x.k==k)){
      // return
    // }
    let v=d[k]
    d[k]=vv===undefined?!v:vv
    setTimeout(()=>{
      d[k]=v
      // _CtrlDriver._refershDataList.push({
        // k:k,
        // _time:Date.now()
      // })
      if(_fun){
        setTimeout(()=>{
          _fun()
        },20)
      }
    },100)
  },
  _isProxibleObj:function(o){
    return o && !o._isBZProxy && _CtrlDriver._proxyTypes.indexOf(o.constructor)>=0;
  },
  _mergeData:function(_from,_toData){
    for(var k in _from){
      _toData[k]=_from[k]
    }
  },
  _replaceData:function(_from,_toData){
    _CtrlDriver._mergeData(_from,_toData);
    for(var k in _toData){
      if(_from[k]!=_toData[k]){
        _toData[k]=undefined;
      }
    }
  },
  _createBZArea:function(_doc){
    var o=$(_doc).find("#bz-tmp-area");
    if(!o.length){
      $("<div id='bz-tmp-area'></div>").insertAfter(_doc.body);
      o=$(_doc).find("#bz-tmp-area");
    }
    return o;
  },
//support parse html to dom-json
  _findKeyOuterBlock:function(vs,tk,_start,bs,_noRegex){
    bs=bs||_CtrlDriver.bd
    let k,b,c,s;
    _init()
    if(vs.push){
      vs=[...vs]
    }
    if(_start){
      vs=vs.push?vs.splice(_start):vs.substring(_start)
    }
    for(let i=0;i<vs.length;i++){
      c=vs[i]
      if(c=="/"&&vs[i+1]==">"){
        vs=vs.substring(0,i)+"></"+vs.match(/^<([^ \/>]+)/)[1]+">"+vs.substring(i+2)
        c=">"
      }
      if(c=="\\"){
        b=!b
      }else if(b){
        b=0
      }else if(!_noRegex&&k=="/"&&c=="/"){
        _init()
        continue
      }else if(!_noRegex&&!k&&c=="/"&&(!s||s.trim().match(/[\(\[\=\?\:]$/))){
        k="/"
        continue
      }else if(k){
        if(k.r==c){
          if(k.n){
            k.n--
          }else{
            _init()
          }
        }else if(k.l==c){
          k.n++
        }
        continue
      }else if(bs[c]){ //([{
        k={l:c,r:bs[c],n:0,p:{k:c}}
      }
      s.push?s.push(c):s+=c;

      let kk=_isKey(s,c)
      if(kk){
        if(vs.pop){
          return {
            e:vs.splice(i+1),
            p:vs.splice(0,i),
            k:kk
          }
        }
        return {
          p:vs.substring(0,i-kk.length+1),
          k:kk,
          e:vs.substring(i+1)
        }
      }
    }

    function _init(){
      k=0
      s=vs.constructor==Array?[]:"";
    }

    function _isKey(s,c){
      if(tk.constructor==Function){
        return tk(s)
      }else if(tk.constructor==RegExp){
        s=s.match(tk)
        return s&&s[0]
      }
      return (tk==s||tk==c)&&tk
    }
  },
  _parseViewDef:function(s){
    let r= {s:s.trim()}
    let rr=[];
    _parseXML(r.s,rr,[])
    if(rr.length==1){
      rr=rr[0]
    }
    return rr

    function _parseXML(s,rs,ps){

      let p=_CtrlDriver._findKeyOuterBlock(s,">")
      if(p){
        let d={}
        rs.push(d)
        p.p=_parseTag(p.p,d)
        _parseProperties(p.p,d)
        p.e=p.e.trim()
        if(p.p&&p.p.endsWith("/")){
          p=_parseContent(p.e,rs)
          // p=_CtrlDriver._findKeyOuterBlock(p.e,"<")
          // if(p.p){
          //   p.p=p.p.trim()
          // }
          // if(p.p){
          //   let dd={}
            
          // }
          return _parseXML(p,rs,ps)
        }else{
          d._items=d._items||[]
          p=_parseContent(p.e,d._items)
          if(p[0]=="/"){
            let i=0
            while(p[0]=="/"){
              p=p.replace(/^\/[^>]+>/,"")
              p=p?_parseContent(p,rs):p
              if(i){
                rs=ps.shift()
              }
              i++
            }
            return _parseXML("<"+p,rs,ps)
          }else{
            ps.unshift(rs)
            return _parseXML("<"+p,d._items,ps)
          }
        }
      }
    }

    function _parseTag(s,d){
      s=s.substring(1)
      let p=_CtrlDriver._findKeyOuterBlock(s," ")
      if(p){
        d._tag=p.p
        return p.e
      }
      if(s.endsWith("/")){
        d._tag=s.substring(0,s.length-1)
        return "/"
      }else{
        d._tag=s
      }
      return ""
    }

    function _parseProperties(s,d){
      s=s.trim()
      if(!s){
        return
      }
      d._attr=d._attr||{}
      let p=_CtrlDriver._findKeyOuterBlock(s,"=")
      if(p){
        p.p=p.p.split(/\s/).map(x=>x);
        let y=p.p.pop()
        p.p.forEach(x=>{
          d._attr[x]=1
        })
        let pp=_CtrlDriver._findKeyOuterBlock(p.e.trim()," "),dd;
        if(y[0]=="_"){
          dd=d
        }else if(["click","dblclick","change","focus","blur","mouseover","mousedown","mouseup","keydown","keyup","keypress"].includes(y)){
          d._jqext=d._jqext||{}
          dd=d._jqext
        }else{
          dd=d._attr
        }
        if(pp){
          dd[y]=_parseValue(pp.p,1)
          _parseProperties(pp.e,d)
        }else{
          dd[y]=_parseValue(p.e,1)
        }
      }else{
        s.split(/\s/).forEach(x=>{
          d._attr[x]=1
        })
      }
    }

    function _parseContent(s,rs){
      s=_CtrlDriver._findKeyOuterBlock(s,"<")
      if(s){
        s.p=s.p.trim()
        if(s.p){
          rs.push({
            _text:_parseValue(s.p)
          })
        }
        return s.e
      }
    }

    function _parseValue(s,p){
      if(p){
        if(s.match(/["'\[]/)){
          eval("s="+s)
          return s
        }
      }
      if(_CtrlDriver._isFunction(s)){
        eval("s="+s)
        return s
      }
      return s
    }

    function _throwError(){
      throw new Error(_bzMessage._system._error._formatError+s.substring(0,100)+(s.length>100?" ...":""))
    }
  },
  _execute:function(_ctrl,_data,_viewDef,_box){
    _doc=_ctrl._document||document;
    _data = _data || _ctrl._data || {};
    _viewDef=_viewDef || _ctrl._viewDef;
    _box=_box || _ctrl._area || (_doc==document?_doc.body:_CtrlDriver._createBZArea(_doc));
    if(!_ctrl._data){
      _ctrl._data=_data;
    }
    if(_data==_ctrl._data){
      _data=_CtrlDriver._buildProxy(_data);
      _ctrl._data=_data;
    }else if(!_data._isBZProxy){
      throw Error("Data is not build in binding. ('"+JSON.stringify(_data,0,2)+"')")
    }
    _CtrlDriver._initUIBind(_ctrl,_data,_viewDef);
    var _dom = _CtrlDriver._drawView(_ctrl,_data,_viewDef,_box);
    _CtrlDriver._curDomItem = null;
    return _dom;
  },
  _monitorData:function(_target,name,value){
    if(window.BZ&&BZ._debugger){
      if(!_CtrlDriver._lastSet){
        _CtrlDriver._lastSet={}
      }
      if(_CtrlDriver._lastSet._target!==_target || _CtrlDriver._lastSet.name!==name){
        _CtrlDriver._lastSet={_target:_target,name:name,value:value,_repeat:0,_repeatValue:0}
      }else{
        if(_CtrlDriver._lastSet.value!==value){
          _CtrlDriver._lastSet._repeatValue++
        }
        _CtrlDriver._lastSet._repeat++
        // if(_CtrlDriver._lastSet._repeat>BZ._debugger){
        //   debugger
        // }else if(_CtrlDriver._lastSet._repeatValue>10&&_CtrlDriver._lastSet._repeatValue<=BZ._repeat/2){
        //   debugger
        // }
      }
    }
  },
  _buildProxy:function(_data,_parent,_name){
    if(!_data){
      return _data
    }
    if(!_data._isBZProxy){
      return new Proxy(_data, {
        _parent:_parent,
        _name:_name,
        get:function(_target, name){
          if(name=="_isBZProxy"){
            return true;
          }else if(name=="_uiMap"){
            if(!this._uiMap){
              this._uiMap={};
            }
            return this._uiMap;
          }else if(name=="constructor"){
            return _target.constructor;
          }else if(name=="_target"){
            return _target;
          }
          
          var _result=_target[name];
          
          //Add to be refreshed ui setting
          if(!this._uiMap){
            this._uiMap={};
          }
          if(_CtrlDriver._isProxibleObj(_result)){
            _target[name]=_CtrlDriver._buildProxy(_target[name],this,name);
          }
          
          if(_CtrlDriver._curDomItem){
            if(!this._uiMap[name] && (_CtrlDriver._isProxibleObj(_target)) && (!_result || _result.constructor!=Function) && !(_target.constructor==Array && name=="length")){
              this._uiMap[name]=[];
            }
            
            if(_result && _result.constructor==Array && !_target[name]._uiMap.splice){
              _target[name]._uiMap.splice=this._uiMap[name];
              _target[name]._uiMap.push=this._uiMap[name];
              _target[name]._uiMap.unshift=this._uiMap[name];
              _target[name]._uiMap.pop=this._uiMap[name];
              _target[name]._uiMap.shift=this._uiMap[name];
            }

            if(this._uiMap[name]&&this._uiMap[name].constructor==Array){
              if(_result && _result.constructor==Function){
                _CtrlDriver._updateArrayUI(this._uiMap[_result.name]);
              }else{
                _CtrlDriver._bindUI(this._uiMap[name]);
              }
            }
          }else if(_result && _target.constructor==Array && _result.constructor==Function && ["splice","push","unshift","pop","shift"].indexOf(_result.name)>=0){
            _CtrlDriver._updateArrayUI(this._uiMap[_result.name]);
          }
          
          return _target[name];
        },
        set:function(_target,name,value){
          _CtrlDriver._monitorData(_target,name,value)
          // console.log(name+":"+value)
          var _toUpdate=false;
          if(_CtrlDriver._isProxibleObj(value)){
            value=_CtrlDriver._buildProxy(value,this,name);
          }

          if(!value || !_target[name] || !value._target || !_target[name]._target){
            _toUpdate=_target[name]!==value;
          }else{
            _toUpdate=value._target !==_target[name]._target
          }

          if(_toUpdate){
            var o=this._uiMap?this._uiMap[name]:0;
            if(o && !_CtrlDriver._updateUIList.includes(o)){
              _CtrlDriver._updateUIList.push(o);
              _CtrlDriver._exeUpdateUI();
            // }else if(this._parent){
            //   var o=this._parent._uiMap[this._name]
            //   if(o && !_CtrlDriver._updateUIList.includes(o)){
            //     _CtrlDriver._updateUIList.push(o);
            //     _CtrlDriver._exeUpdateUI();
            //   }
            }
            o=_CtrlDriver._rootUpdateMap
            if(o && !_CtrlDriver._updateUIList.includes(o)){
              _CtrlDriver._updateUIList.push(o);
              _CtrlDriver._exeUpdateUI();
            }
          }
          
          if(_target[name] && _target[name]._uiMap){
            if(value && value._isBZProxy && !value._uiMap){
              value[0];
              delete value._uiMap[0];
            }
            if(value && value._uiMap && value._uiMap!=_target[name]._uiMap){
              for(var k in _target[name]._uiMap){
                var _vList=value._uiMap[k];
                var _tList=_target[name]._uiMap[k];
                
                if(_vList && _vList!=_tList){
                  for(var i=0;i<_tList.length;i++){
                    if(!_vList.includes(_tList[i])){
                      _vList.push(_tList[i]);
                    }
                  }
                }else{
                  value._uiMap[k]=_target[name]._uiMap[k];
                }
                _CtrlDriver._cleanList.add(value._uiMap[k]);
              }
            }
          }
          var _result=(_target[name]=value);
          if(value===undefined && this._uiMap){
            delete this._uiMap[name]
          }
          if(_target.constructor==Array && name=="length" && _result==0){
            return true;
          }else if(_target.constructor==Array && (parseInt(name) || parseInt(name)==0) && !_result){
            return true;
          }
          return _result;
        }
      });
    }else{
      return _data;
    }
  },
  _updateArrayUI:function(_uiList){
    if(_uiList){
      if(_CtrlDriver._arrayUIList.indexOf(_uiList)<0){
        _CtrlDriver._arrayUIList.push(_uiList);
      }
      if(_CtrlDriver._arrayUITimeout){
        clearTimeout(_CtrlDriver._arrayUITimeout);
      }
      _CtrlDriver._arrayUITimeout=setTimeout("_CtrlDriver._updateArrayUI()");
      return;
    }
    var _timer=Date.now();
    _CtrlDriver._inUpdateArrayUIList=true;
    while(_CtrlDriver._arrayUIList.length){
      var u=_CtrlDriver._arrayUIList.shift();
      _CtrlDriver._updateDataUI(u,_timer);
    }
    _CtrlDriver._inUpdateArrayUIList=false;
  },
  _updateDataUI:function(_uiList,_timer){
    if(!_uiList){
      return;
    }
//    var _ignore=0;
//    var _exe=0;
//    console.time("_updateDataUI")
//    console.log("_uiList.length: "+_uiList.length)
    for(var i=0;i<_uiList.length;i++){
      var u=_uiList[i];
      if(i){
        let lu=_uiList[i-1]
        if(u._dom==lu._dom&&u._attr==lu._attr&&u._group==lu._group){
          continue
        }
      }
      if($(u._dom.ownerDocument).find(u._dom).length){
        if(_timer && u._time>_timer){
//          _ignore++;
          continue;
//        Don't remove the comment for chrome debug modal!!!
        }
//        _exe++;
        try{
          if(!u._dom._data&&u._dom._viewDef._data){
            u._dom._data=_CtrlDriver._retrieveResult(u._dom._viewDef._data,{},{});
          }
          _CtrlDriver._curSignedList=[];
          _CtrlDriver._updateCount++;
          _CtrlDriver._curDomItem=u;
          if(u._attr=="_if"){
            if(u._dom._viewDef._if){
              _CtrlDriver._updateIf(u);
            }
          }else if(u._attr=="['load']"){
            if(u._dom._viewDef._load){
              _CtrlDriver._loadContent(u);
            }else{
              _uiList.splice(i,1);
              i--;
            }
          }else if(u._attr=="['html']"){
            _CtrlDriver._updateHtml(u);
          }else if(u._attr=="['text']"){
            if(u._dom._viewDef._text){
              _CtrlDriver._updateText(u);
            }
          }else if(u._attr=="['value']"){
            _CtrlDriver._updateValue(u);
          }else if(u._attr=="rebuild"){
            _CtrlDriver._updateRebuild(u);
          }else if(u._attr=="repeat"){
            _CtrlDriver._updateRepeat(u);
          }else{
            _CtrlDriver._updateAttr(u);
          }
        }catch(e){_CtrlDriver._handleError(e);}
      }else{
//        _ignore++
        _uiList.splice(i,1);
        i--;
      }
    }
//    console.timeEnd("_updateDataUI")
//    console.log("_ignore: "+_ignore)
  },
  _handleError:function(_error){
//    console.clear();
    if(window._inDebugging){
      console.log(_error.stack)
    }
  },
  _initUIBind:function(_ctrl,_data,_viewDef,_hookers){
    _CtrlDriver._curSignedList=[];
    var _doc=_ctrl._document || document;
    _CtrlDriver._curDomItem=_doc.createTextNode("");
    _CtrlDriver._curDomItem._ctrl=_ctrl;
    _CtrlDriver._curDomItem._data=_data;
    _CtrlDriver._curDomItem._viewDef=_viewDef;
    _CtrlDriver._curDomItem._hookers=_hookers?_hookers:[];
    _CtrlDriver._curDomItem={_dom:_CtrlDriver._curDomItem,_attr:"_if"};
  },
  _initUIBindByDom:function(_dom){
    _CtrlDriver._initUIBind(_dom._ctrl,_dom._data,_dom._viewDef,_dom._hookers);
  },
  _changeBindAttr:function(_attr){
    _CtrlDriver._curDomItem={
      _dom:_CtrlDriver._curDomItem._dom,
      _attr:_attr
    };
  },
  _replaceBindDom:function(_newDom,_attr,_clean){
    if(_newDom){
      _newDom._ctrl=_CtrlDriver._curDomItem._dom._ctrl;
      _newDom._data=_CtrlDriver._curDomItem._dom._data;
      _newDom._viewDef=_CtrlDriver._curDomItem._dom._viewDef;
      _newDom._hookers=_CtrlDriver._curDomItem._dom._hookers;
      _CtrlDriver._curDomItem._dom=_newDom;
    }
    if(_attr){
      _CtrlDriver._curDomItem._attr=_attr;
    }
    for(var i=0;i<_CtrlDriver._curSignedList.length;i++){
      var o=_CtrlDriver._curSignedList[i];
      if(_newDom){
        o._dom=_newDom;
      }
      if(_attr){
        o._attr=_attr;
      }
    }
    if(_clean){
      _CtrlDriver._curSignedList=[];
    }
  },
  _retrieveResult:function(_exe,_data,_ctrl,_dom){
    var _result=null;
    try{
      if(_exe && _exe.constructor==Function){
        _result=_exe(_data,_ctrl,_dom);
      }else if(_exe && (_exe.constructor==Array || _exe.constructor==Object)){
        _result=_exe;
      }else if(_exe && _exe.constructor!=String){
        _result=_exe;
      }else{
        try{
          if(_exe && (_exe.includes(".") || (_exe.endsWith("'") && _exe[0]=="'")) && !_exe.endsWith(".")){
            eval("_result="+_exe);
          }else{
            _result=_exe;
          }
        }catch(e){
          _result=_exe;
          if(e.message && (e.message.includes("null") || e.message.includes("undefined"))){
            if(_exe.constructor==String){
              _result="";
            }
          }
        }
      }
    }catch(ee){
      _result=""
      console.log(ee.stack)
      if(!ee.message || (!ee.message.endsWith("of null") && !ee.message.endsWith("of undefined"))){
        console.error(ee);
      }
    }
    
    return _result;
  },
  //triggered on get data attributes
  _bindUI:function(_uiList){
    if(!_uiList||_uiList.constructor==Function){
      return;
    }
    for(var i=0;i<_uiList.length;i++){
      var u=_uiList[i];
      if(u._dom==_CtrlDriver._curDomItem._dom && u._attr==_CtrlDriver._curDomItem._attr){
        if(u._attr=="repeat" && u._viewDef._dataRepeat !==_CtrlDriver._curDomItem._viewDef._dataRepeat){
          continue;
        }
        return;
      }
    }

    if(!_uiList.includes(_CtrlDriver._curDomItem)){
      _CtrlDriver._curDomItem._time=Date.now();
      _uiList.push(_CtrlDriver._curDomItem);
      _CtrlDriver._curSignedList.push(_CtrlDriver._curDomItem);
      _CtrlDriver._cleanList.add(_uiList);
      _CtrlDriver._exeCleanList();
    }
  },
  //triggered on set data attributes
  _cleanDom:function(_dom){
    $(_dom).remove();
    if(_dom.children){
      for(var i=0;i<_dom.children.length;i++){
        _CtrlDriver._cleanDom(_dom.children[i])
      }
    }
  },
  _isRemovedElement:function(e){
    while(e.parentElement){
      if(["BODY","HTML"].includes(e.tagName)){
        return
      }
      e=e.parentElement
    }
    return 1
  },
  _cleanData:function(_data,_key){
    if(_key){
      if(_data.constructor==Array){
        if($.isNumeric(_key)){
          _data.splice(_key,1);
        }else{
          _data.forEach(x=>{
            x[_key]=0;
            delete x[_key];
          })
        }
      }else{
        _data[_key]=0;
        delete _data[_key];
      }
      return
    }
    if(_data.constructor==Array){
      while(_data.length){
        _data.pop();
      }
    }else{
      for(var k in _data){
        _data[k]=null;
        delete _data[k];
      }
    }
  },
  _exeCleanList:function(_lanuch){
    if(!_lanuch){
      if(_CtrlDriver._curCleanListTimeout){
        clearTimeout(_CtrlDriver._curCleanListTimeout)
      }
      _CtrlDriver._curCleanListTimeout=setTimeout(function(){
        _CtrlDriver._exeCleanList(1)
      },1);
      return;
    }
    var _timer=Date.now(),_count=0,_chk=0,_item=0;
//    console.time("_exeCleanList")
//    console.log("_CtrlDriver._cleanList: "+_CtrlDriver._cleanList.size)
    for(var _uiList of _CtrlDriver._cleanList){
      var _tmpList=[],_tmpAttrList=[],_tmpMap={};
      _item++;
      for(var i=0;i<_uiList.length;i++){
        var u=_uiList[i],os=0;
        _chk++;
        
        if((!u._dom.parentElement || !u._dom.ownerDocument || !u._dom.ownerDocument.defaultView ||(!u._dom.parentElement.getBoundingClientRect().width &&_CtrlDriver._isRemovedElement(u._dom.parentElement))) && u._time<_timer){
          os=_uiList.splice(i--,1);
        }else if(_tmpList.indexOf(u._dom)<0){
          _tmpAttrList.push([u._attr]);
          _tmpList.push(u._dom);
        }else{
          var _idx=_tmpList.indexOf(u._dom);
          if(u._attr=="repeat" || _tmpAttrList[_idx].indexOf(u._attr)<0){
            _tmpAttrList[_idx].push(u._attr);
          }else{
            os=_uiList.splice(i--,1);
          }
        }
        
        if(os){
          _CtrlDriver._cleanDom(os[0])
          _count++;
        }
      }
    }
    _CtrlDriver._cleanList.clear()
//    console.timeEnd("_exeCleanList")
  },
  _assignFunForAfterUpdate:function(f){
    if(!_CtrlDriver._afterUpdateFunList.includes(f)){
      _CtrlDriver._afterUpdateFunList.push(f)
    }
    clearTimeout(_CtrlDriver._assignFunTimer)
    _CtrlDriver._assignFunTimer=setTimeout(()=>{
      if(!_CtrlDriver._updateUIList.length){
        _CtrlDriver._exeAfterUpdate()
      }
    },20)
},
  _exeAfterUpdate:function(){
      while(_CtrlDriver._afterUpdateFunList.length){
        _CtrlDriver._afterUpdateFunList.shift()();
      }
    // clearTimeout(_CtrlDriver._exeAssignTimer)
    // _CtrlDriver._exeAssignTimer=setTimeout(function(){
      // while(_CtrlDriver._afterUpdateFunList.length){
        // _CtrlDriver._afterUpdateFunList.shift()();
      // }
    // },50)
  },
  _exeUpdateUI:function(_lanuch){
    if(!_lanuch){
      if(_CtrlDriver._curUIUpdateTimeout){
        clearTimeout(_CtrlDriver._curUIUpdateTimeout)
      }
      _CtrlDriver._curUIUpdateTimeout=setTimeout(function(){
        _CtrlDriver._exeUpdateUI(1)
      },1);
      return;
    }
    var _timer=Date.now();
    _CtrlDriver._updateCount=0;
    var ul=[];
    // var t1=Date.now()
    while(_CtrlDriver._updateUIList.length){
      var _uiList=_CtrlDriver._updateUIList.shift();
      for(var i=0;i<_uiList.length;i++){
        var u=_uiList[i];
        if(ul.indexOf(u)<0){
          ul.push(u);
        }
      }
      _CtrlDriver._cleanList.add(_uiList);
    }
    _CtrlDriver._updateDataUI(ul,_timer);
    _CtrlDriver._exeCleanList();

    _CtrlDriver._curDomItem=null;
    _CtrlDriver._curSignedList=[];
    if(!_CtrlDriver._updateUIList.length){
      _CtrlDriver._exeAfterUpdate()
    }
  //  console.log("update time: "+(Date.now()-t1))
},
  _updateValue:function(u){
    var _data=u._dom._data;
    var _viewDef=u._dom._viewDef;
    var _value=null;
    try{
      if(_viewDef._dataModel.constructor==Function){
        eval("_value="+_viewDef._dataModel(_data));
      }else{
        eval("_value="+_viewDef._dataModel);
      }

      if(_value===undefined || _value===null){
        _value="";
      }else if(_value&&![Object,Array].includes(_value.constructor)){
        _value=_value.toString();
      }
      if(u._dom.contenteditable){
        let fs=$(u._dom.ownerDocument).find(":focus")[0];
        if(fs&&(fs!=u._dom&&!$(u._dom).find(fs)[0])){
          u._dom._refresh&&u._dom._refresh()
        }
      }else if(u._dom.type && u._dom.type=="checkbox"){
        u._dom.checked=(_value&&u._dom.value=="on")||(_value==u._dom.value)
      }else if(u._dom.type && u._dom.type=="radio"){
        u._dom.checked=(u._dom._orgValue||u._dom.value)==_value;
      }else if(u._dom.tagName=="SELECT"){
        var ps=u._dom.options;
        for(var i=0;i<ps.length;i++){
          var p=ps[i];
          if(p._orgValue == _value || p.value==_value){
            u._dom.value=p.value;
            return;
          }
        }
      }else{
        var _focus=$(u._dom.ownerDocument).find("*:focus")[0]==u._dom;
        if(!_focus){
          if(u._dom._viewDef._formatGet){
            _value=u._dom._viewDef._formatGet(_value,u._dom)
            if(_value===undefined){
              _value=""
            }
          }
          u._dom.value=_value;
        }else{
          _CtrlDriver._inTyping=true;
          if(!u._dom._bzTypingBlur){
            u._dom._bzTypingBlur=true;
            $(u._dom).blur(function(){
              this._bzTypingBlur=false;
              _CtrlDriver._inTyping=false;
            });
          }
        }
      }
    }catch(e){_CtrlDriver._handleError(e);}
  },
  _updateAttr:function(u){
    var _data=u._dom._data;
    var _viewDef=u._dom._viewDef;
    if(!_viewDef._attr){
      return;
    }
    var _value="";
    eval("_value=_viewDef"+u._attr);

    var _result=_CtrlDriver._retrieveResult(_value,_data,u._dom._ctrl,u._dom);
    _result=_result===undefined?"":_result;
    if(u._attr=="['_attr']['style']"){
      if(_result){
        _result=_result.split(";");
        for(var i=0;i<_result.length;i++){
          var r=_result[i].split(":");
          r.length>1&&u._dom.style.setProperty(r[0],r[1].replace(" !important",""),r[1]&&r[1].includes("!important")?"important":"")
        }
      }
    }else if(u._attr=="['_attr']['class']"){
      u._dom.className=_result;
    }else{
      var _attr=u._attr.split("]['")[1].split("'")[0];
      if(["disabled","readonly","checked","selected","draggable","droppable","enable"].includes(_attr)){
        _result=Boolean(_result)
      }

      if(_attr=="value"){
        u._dom.value=_result;
      }else{
        u._dom[_attr]=_result;
        $(u._dom).attr(_attr,_result);
        if(_attr=="enable"||_attr=="disabled"){
          _CtrlDriver._attachEnable(u._dom);
        }
      }
    }
  },
  _loadContent:function(u){
    var _dom=_CtrlDriver._curDomItem._dom;
    if(u){
      _CtrlDriver._curDomItem=u;
      _dom=u._dom;
    }else{
      _CtrlDriver._curDomItem={_dom:_dom,_attr:"['load']"};
    }
    var _data=_dom._data;
    var _ctrl=_dom._ctrl;
    var _ajax=_dom._viewDef._load;
    if(!_ajax){
      return
    }else if(_ajax.constructor==Function || _ajax.constructor==String){
      _ajax=_CtrlDriver._retrieveResult(_ajax,_dom._data,_dom._ctrl);
    }
    if(_ajax.constructor==String){
      _ajax={url:_ajax,dataType:"text/plain"};
    }
    //cache last ajax;
    if(_CtrlDriver._equalObj(_dom._viewDef._lastLoad,_ajax) && !_ajax._noCache){
      if(_dom._viewDef._html){
        return _CtrlDriver._updateHtml(u);
      }else if(_dom._viewDef._text){
        return _CtrlDriver._updateText(u);
      }
      return _dom;
    }
    _dom._viewDef._lastLoad=_ajax;
    
    $.ajax(_ajax).fail(function(e){
      if(e.message){
        alert("Load page error: "+e.message);
      }else if(e.responseText){
        _buildDom(e);
      }
    }).done(function(e){
      _buildDom(e);
    });
    function _buildDom(d){
      if(d.responseText){
        d=d.responseText;
      }
      //_handler: customize function
      if(_ajax._handler){
        d=_ajax._handler(d);
      }
      var dd=null;
      var _doc=_dom._ctrl._document || document;
      var _box=_doc==document?_doc.body:_CtrlDriver._createBZArea(_doc);
      try{
        if(_dom.tagName=="SCRIPT"){
          eval(d);
        }else{
          //The loading file is a viewDef json file
          eval("dd="+d);
          if(!_dom._viewDef._noCache){
            delete _dom._viewDef._load
            Object.assign(_dom._viewDef,dd)
          }else{
            _dom._viewDef=dd;
          }
          dd=_CtrlDriver._drawView(_dom._ctrl,_dom._data,_dom._viewDef,_box,_dom);
        }
      }catch(e){
        //The loading file is a html file
        var dd=$(d)[0];
        if(!dd){
          dd=_doc.createTextNode(d);
        }
      }
      if(dd){
        dd._ctrl=_dom._ctrl;
        dd._data=_dom._data;
        dd._viewDef=_dom._viewDef;
        if(dd._viewDef._load){
          if(dd.outerHTML){
            dd._viewDef._html=d;
          }else{
            dd._viewDef._text=d;
          }
          if(_dom._resultDom){
            _CtrlDriver._cleanDom(_dom._resultDom);
          }
          $(dd).insertAfter(_dom);
          _dom._resultDom=dd;
          return dd;
        }else{
          $(_dom).replaceWith(dd);
        }
      }
    }
    _CtrlDriver._attachEnable(_dom);
    return _dom;
  },
  _updateHtml:function(u){
    if(u){
      _CtrlDriver._curDomItem=u;
    }else{
      _CtrlDriver._curDomItem={_dom:_CtrlDriver._curDomItem._dom,_attr:"['html']"};
    }
    var _doc=_CtrlDriver._curDomItem._dom._ctrl._document || document;
    var _dom=_CtrlDriver._curDomItem._dom;
    var _tmpResult=_CtrlDriver._retrieveResult(_dom._viewDef._html,_dom._data,_dom._ctrl);
    var _tmpDom=null;
    if(_tmpResult!==null && _tmpResult!==undefined){
      if(_tmpResult.constructor==String){
        _tmpResult=_tmpResult.trim();
      }
      if(_tmpResult.constructor==String && _tmpResult[0]=="<" && _tmpResult[_tmpResult.length-1]==">"){
        _tmpDom=$(_tmpResult)[0]
      }else if(_tmpResult.nodeType){
        _tmpDom=_tmpResult;
      }
      if(!_tmpDom){
        _tmpDom=_doc.createTextNode(_tmpResult);
      }
    }else{
      _tmpDom=_doc.createTextNode("");
    }
    
    if(u){
      $(u._dom).replaceWith(_tmpDom);
    }
    _CtrlDriver._replaceBindDom(_tmpDom,"['html']",true);
    return _tmpDom;
  },
  _updateText:function(u){
    var _dom=_CtrlDriver._curDomItem._dom;
    if(u){
      _CtrlDriver._curDomItem=u;
    }else{
      _CtrlDriver._curDomItem={_dom:_dom,_attr:"['text']"};
    }
    var _doc=_dom._ctrl._document || document;
    
    var _tmp=_CtrlDriver._retrieveResult(_dom._viewDef._text,_dom._data,_dom._ctrl,_dom);
    if(_tmp===null || _tmp===undefined){
      _tmp="";
    }
    _dom.textContent=_tmp;
    if(_dom.innerHTML){
      _dom.innerHTML=_dom.innerHTML.replace(/\&(amp\;)([\#0-9a-z]+\;)/g,"&$2")
    }
    _CtrlDriver._replaceBindDom(null,"['text']",true);
    return _dom;
  },
  _updateRebuild:function(u){
    var _box=u._dom.parentElement;
    var _dom=_CtrlDriver._drawView(u._dom._ctrl, u._dom._data, u._dom._viewDef);
    if(_dom){
      if(_dom.constructor!=Array){
        _dom=[_dom];
      }
      for(var i=0;i<_dom.length;i++){
        $(_dom[i]).insertAfter(u._dom);
      }
    }
    _CtrlDriver._cleanDom(u._dom);
  },
  _updateIf:function(u){
    if(u){
      _CtrlDriver._initUIBindByDom(u._dom);
    }
    var _dom=_CtrlDriver._curDomItem._dom;
    var _value = _CtrlDriver._retrieveResult(_dom._viewDef._if,_dom._data,_dom._ctrl,_dom);
    
    if(!_value || (_value.constructor==String && _value==_dom._viewDef._if)){
      if(u && u._dom.nodeType==_dom.nodeType && !u._dom.textContent){
        _CtrlDriver._curDomItem._dom=u._dom;
        return;
      }else if(!u){
        return null;
      }else{
        var _tmp=_CtrlDriver._curDomItem._dom;
        if(((_dom._viewDef._animation && _dom._viewDef._animation._hide) || _CtrlDriver._animationHideAll) && (!_dom._viewDef._animation || _dom._viewDef._animation._hide!="none")){
          if(_dom._viewDef._animation && _dom._viewDef._animation._hide){
            _dom._viewDef._animation._hide(u._dom,function(){
              _toHide(u,_tmp);
            });
          }else{
            _CtrlDriver._animationHideAll(u._dom,function(){
              _toHide(u,_tmp);
            });
          }
        }else{
          _toHide(u,_tmp);
        }
        return;
      }
    }else if(u && (u._dom.nodeType!=_dom.nodeType || u._dom.textContent)){
      return;
    }else if(!u){
      return _CtrlDriver._curDomItem;
    }
    if(u._dom._viewDef._dataRepeat){
      _CtrlDriver._repeatData(u._dom._ctrl,u._dom._data,u._dom._viewDef,u._dom.parentElement,u._dom);
      _CtrlDriver._cleanDom(u._dom);
    }else{
      
      if(u._dom._viewDef._tag){
        _dom=_CtrlDriver._updateDom(u);
      }else if(u._dom._viewDef._load){
        _dom=_CtrlDriver._loadContent(u);
      }else if(u._dom._viewDef._html){
        _dom=_CtrlDriver._updateHtml(u);
      }else if(u._dom._viewDef._text){
        _dom=_CtrlDriver._updateText(u);
      }
      
      var _doAnimation=((_dom._viewDef._animation && _dom._viewDef._animation._show) || _CtrlDriver._animationShowAll) && (!_dom._viewDef._animation || _dom._viewDef._animation._show!="none");
      if(_doAnimation && _dom.tagName){
        _dom.style.display="none";
      }
      $(u._dom).replaceWith(_dom);
      if(_dom.parentElement){
        _CtrlDriver._attachEnable(_dom.parentElement,_dom);
      }
      if(_doAnimation && _dom.tagName){
        if(_dom._viewDef._animation && _dom._viewDef._animation._show){
          _dom._viewDef._animation._show(_dom);
        }else if(_CtrlDriver._animationShowAll){
          _CtrlDriver._animationShowAll(_dom); 
        }
      }
    }
    function _toHide(u,_tmp){
      $(u._dom).replaceWith(_tmp);
      _CtrlDriver._cleanDom(u._dom);
      u._dom=_tmp;
    }
  },
  _buildDom:function(u){
    u=u._dom;
    var _data=u._data;
    if(u._viewDef._data){
      u._data=_data=_CtrlDriver._retrieveResult(u._viewDef._data,u._data,u._ctrl)||_data;
    }
    var _tag=_CtrlDriver._retrieveResult(u._viewDef._tag,u._data,u._ctrl);

    var _html="<"+_tag+" ";
    
    var _body=_CtrlDriver._fillAttrs(u._viewDef,_data,u._ctrl);
    if(_body===null || (_body && (_body.constructor==Object || _body.constructor==Array))){
      _html+=_body._html;
    }else{
      _html+=_body;
    }
    if(["INPUT","IMG","BR","HR"].indexOf(_tag.toUpperCase())>=0){
      _html+="/>";
    }else{
      _html+="></"+_tag+">"
    }
    var _dom= $(_html)[0];
    if(_body===null || (_body && (_body.constructor==Object || _body.constructor==Array))){
      _dom._orgValue=_body._orgValue;
    }
    if(u._viewDef._after){
      setTimeout(function(){
        u._viewDef._after(_dom,_data)
      },u._viewDef._animation?1010:10)
    }

    return _dom;
  },
  _updateDom:function(u,_data){
    var _dom=_CtrlDriver._buildDom(u);
    
    _CtrlDriver._replaceBindDom(_dom,null,true);
    
    _CtrlDriver._bindJqExt(_dom._viewDef._jqext,_dom,_data);
    _CtrlDriver._setBZCommonBehavior(_dom);
    
    var id=null;
    if(_dom._viewDef.id){
      id=_dom._viewDef.id;
    }else if(_dom._viewDef._attr && _dom._viewDef._attr.id){
      id=_dom._viewDef._attr.id;
    }
    if(id){
      if(!_dom._ctrl._comps){
        _dom._ctrl._comps={};
      }
      _dom._ctrl._comps[id]=_dom;
    }
    var _hasItems=0
    if(_dom._viewDef._items){
      var _items=_dom._viewDef._items;
      if(_items.constructor==String || _items.constructor==Function){
        _items=_CtrlDriver._retrieveResult(_items,_dom._data,_dom._ctrl,_dom);
      }
      
      for(var i=0;_items&&i<_items.length;i++){
        _hasItems=1
        var r=_items[i];
        if(r){
          if(r.constructor==String){
            r=_CtrlDriver._parseViewDef(r)
          }
          _CtrlDriver._drawView(_dom._ctrl,_dom._data,r,_dom);
        }
      }
    }
    if(_hasItems){
    }else if(_dom._viewDef._load){
      _dom=_CtrlDriver._loadContent();
    }else if(_dom._viewDef._html){
      $(_dom).append(_CtrlDriver._updateHtml());
    }else if(_dom._viewDef._text){
      $(_dom).append(_CtrlDriver._updateText());
    }

    if(_dom._viewDef._required){
      var _required=_CtrlDriver._retrieveResult(_dom._viewDef._required,_dom._data,_dom._ctrl);
      if(_required){
        if(!$(_dom).val()){
          $(_dom).addClass("required");
        }
        $(_dom).on("input",function(){
          if(!this.value){
            $(this).addClass("required");
          }else{
            $(this).removeClass("required");
          }
        });
      }
    }
    
    if(_dom._viewDef._dataModel){
      var _tag=_CtrlDriver._retrieveResult(_dom._viewDef._tag,_dom._data,_dom._ctrl);
      if(["INPUT","SELECT","TEXTAREA"].includes(_tag.toUpperCase())||(_dom._viewDef._attr&&_dom._viewDef._attr.contenteditable)){
        if(_dom._viewDef._attr && _dom._viewDef._attr.type){
          var type=_CtrlDriver._retrieveResult(_dom._viewDef._attr.type,_dom._data,_dom._ctrl);
        }else{
          type="text";
        }
        
        //_trigger data update by databind
        var _event="change";
        if(["INPUT","TEXTAREA"].indexOf(_dom.tagName)>=0 && type!="checkbox" && type!="radio"){
          _event="input";
        }
        _event=_dom._viewDef._updateEvent || _event;
        $(_dom).on("change",function(){
          this._bzUpdate=1
        })
        $(_dom).on(_event,function(){
          let _this=this;
          try{
            _CtrlDriver._typingBox=_this;
            var _data=_this._data;
            var _bind=_this._viewDef._dataModel;
            if(_bind.constructor==Function){
              _bind=_bind(_data)
            }
            if(_this.type=="checkbox"){
              if(_this.checked){
                eval(_bind+"=_this._orgValue||_this.value");
              }else{
                eval(_bind+"=null");
                eval("delete "+_bind);
              }
            }else{
              var _value=null;
              if(_this._viewDef._dataType==Number){
                _value=parseFloat(_this.value);
                if(!_value){
                  _value=0;
                }
              }else{
                _value=_this.value;
              }
              if(_this.tagName=="SELECT"){
                if(_this.selectedOptions[0]._orgValue){
                  _value=_this.selectedOptions[0]._orgValue;
                }
              }else if(_this.type=="radio"){
                _value=_this._orgValue||_this.value;
              }
              if(_this._viewDef._formatSet){
                _value=_this._viewDef._formatSet(_value,_data,_this);
              }
              eval(_bind+"=_value");
            }
          }catch(e){}
        });
        $(_dom).on(_event=="input"?"change":_event,function(e){
          let _this=this,_org=this
          _CtrlDriver._chkIgnoreUpdate(_this,function(){
            while(_this&&_this._viewDef&&!_this._viewDef._update){
              if(_this._viewDef._noUpdate||_this.tagName=="BODY"){
                return
              }
              _this=_this.parentElement
            }
            if(!_org._bzUpdate){
              return
            }
            _org._bzUpdate=0
            if(_this&&_this._viewDef){
              setTimeout(function(){
                var _update=_this._viewDef._update
                if(_update.constructor==Function){
                  _update(_data,_dom,_this)
                }else{
                  eval(_update)
                }
              },100)
            }
          })
        })
        $(_dom).on("keyup",function(){
          this._bzOldValue=this._bzOldValue===undefined&&this.value
        })
        $(_dom).on("blur",function(){
          this._bzOldValue=undefined
          if(["INPUT","TEXTAREA"].includes(this.tagName)){
            this.value=this.value.trim()
            //$(this).change()
          }
          _CtrlDriver._typingBox=null;
        });

        var _data=_dom._data;
        _CtrlDriver._curDomItem={_dom:_dom,_attr:"['value']"};
        try{
          if(_dom._viewDef._dataModel.constructor==Function){
            eval("_value="+_dom._viewDef._dataModel(_data));
          }else{
            eval("_value="+_dom._viewDef._dataModel);
          }
          //set value by data bind
          if(type=="checkbox"){
            _dom.checked=_dom.value=="on"?!!_value:_dom.value==_value;
          }else if(type=="radio"){
            _dom.checked=(_dom._orgValue||_dom.value)==(_value||(_value===0?"0":""));
          }else{
            if(_dom._viewDef._formatGet){
              _value=_dom._viewDef._formatGet(_value,_data,_dom);
            }
            $(_dom).val(_value);
            if(_value===null || (_value && (_value.constructor==Object || _value.constructor==Array))){
              _dom._orgValue=_value;
              if(_dom.tagName=="SELECT"){
                for(var i=0;i<_dom.options.length;i++){
                  var op=_dom.options[i];
                  if(op._orgValue==_value || (op._orgValue && _value && _dom._viewDef._key && op._orgValue[_dom._viewDef._key]==_value[_dom._viewDef._key])){
                    op.selected=true;
                    break;
                  }
                }
              }
            }
          }
        }catch(e){
          console.log("BZ-LOG: "+_dom._viewDef._dataModel)
          _CtrlDriver._handleError(e);
        }
        
      }else{
        _CtrlDriver._curDomItem={_dom:_dom,_attr:"rebuild"};
        try{
          var _data=_dom._data;
          eval(_dom._viewDef._dataModel);
        }catch(e){_CtrlDriver._handleError(e);}
      }
    }
    
    if(_dom._viewDef._focus){
      var _focus=!_CtrlDriver._inTyping && _CtrlDriver._retrieveResult(_dom._viewDef._focus,_dom._data,_dom._ctrl);
      if(_focus){
        setTimeout(function(){
          if(!_CtrlDriver._inTyping){
            $(_dom).focus();
            if(_dom._viewDef._select){
              $(_dom).select()
            }
          }
        },10);
      }
    }
    _CtrlDriver._curSignedList=[];
    _CtrlDriver._attachEnable(_dom);
    return _dom;
  },
  _triggerUpdateData:function(cd,_from,d,_fun){
    _from=_from||cd
    d=d||_from._data
    if(cd._viewDef){
      if(cd._viewDef._update){
        if(cd._viewDef._update.constructor==Function){
          cd._viewDef._update(d,_from,cd,_fun)
        }else{
          eval(cd._viewDef._update)
        }
      }else if(cd.parentElement){
        _CtrlDriver._triggerUpdateData(cd.parentElement,_from,d,_fun)
      }
    }
  },
  _chkIgnoreUpdate:function(_this,_doUpdate){
    if(_this._viewDef._ignoreUpdate){
      let _ignoreUpdate=$(_this._viewDef._ignoreUpdate)[0]
      if(_ignoreUpdate&&_ignoreUpdate.getBoundingClientRect().width){
        return
      }
    }else if(_this._viewDef._cancelUpdate){
      return
    }
    _doUpdate()
  },
  _updateRepeat:function(u){
    var _data=u._supData;
    _CtrlDriver._curDomItem=u;
    _data=_CtrlDriver._retrieveResult(u._group,_data,u._ctrl);
    if(_data && _data.constructor==Number){
      _data=new Array(_data).fill(0);
      _CtrlDriver._updateRepeatInArray(u,_data);
    }else if(_data && _data.constructor==Array){
      _CtrlDriver._updateRepeatInArray(u,_data);
    }else{
      _CtrlDriver._updateRepeatInObject(u,_data);
    }
    _CtrlDriver._attachEnable(u._dom);
  },
  _updateRepeatInArray:function(u,_data){
    var _idx=0;
    var _last=0,_tmp=0;
    for(var i=0;i<u._dom.childNodes.length;i++){
      var o=u._dom.childNodes[i];
      if(o._data && o._data._group==u._group && o._data._supData==u._supData){
        if(!_tmp){
          _tmp=_last=$("<div></div>").insertBefore(o)[0]
          continue
        }
        if(!$.isNumeric(o._data._idx)){
          _CtrlDriver._cleanDom(o);
          i--;
          continue;
        }else {
          o._data._idx=_idx
          if(!_data || _idx>=_data.length){
            _CtrlDriver._cleanDom(o);
            i--;
          }else if(o._data._item!=_data[_idx]){
            var d=o._data._item;
            var dd=_data[_idx]
            
            try{
              if(_CtrlDriver._typingBox && $(o).find(_CtrlDriver._typingBox).length){
                if(JSON.stringify(d)==JSON.stringify(_data[_idx])){
                  return;
                }
              }
            }catch(e){}

            if(![Object,Array].includes(o._data._item)){
              o._data._item=dd
              // let fs=$(o.ownerDocument).find(":focus")[0]
              // if(fs&&(fs==o||$(o).find(fs)[0])){
              //   _last=o
              // }else{
                var _dom=_CtrlDriver._drawView(o._ctrl,o._data,o._viewDef);
                $(_dom).insertBefore(o);
                _CtrlDriver._cleanDom(o)
                _last=_dom;
              // }
            }else if(_data.includes(d)){
              var _newData=_CtrlDriver._simpleClone(o._data)
              _newData._item=dd
              var _dom=_CtrlDriver._drawView(o._ctrl,_newData,o._viewDef);
              $(_dom).insertBefore(o);
              _last=_dom;
            }else{
              _CtrlDriver._cleanDom(o)
              i--
              continue
            }
          }else if(o._data._idx!=o._data._key){
            o._data._key=o._data._idx
            var _dom=_CtrlDriver._drawView(o._ctrl,o._data,o._viewDef);
            $(_dom).insertBefore(o);
            _last=_dom;
            _CtrlDriver._cleanDom(o)
          }else{
            _last=o
          }
        }
        _idx++;
      }else if(_idx){
        break;
      }
    }
    if(_last!=_tmp){
      _CtrlDriver._cleanDom(_tmp)
      _tmp=0
    }
    var _tmpViewDef=_CtrlDriver._clone(u._viewDef);
    delete _tmpViewDef._dataRepeat;
    let _lastItem=_findEndItem(u._dom)

    for(var n=_idx;_data && n<_data.length;n++){
      var _dom=_CtrlDriver._drawView(u._ctrl,{_item:_data[n],_group:u._group,_supData:u._supData,_idx:n,_key:n},_tmpViewDef);
      if(_last){
        $(_dom).insertAfter(_last);
        if(_last===_tmp){
          _CtrlDriver._cleanDom(_last)
          _tmp=0
        }
      }else if(_lastItem){
        $(_dom).insertBefore(_lastItem)
      }else{
        $(u._dom).append(_dom);
      }
      _last=_dom;
    }
    if(_last==_tmp && _tmp){
      _CtrlDriver._cleanDom(_last)
    }

    function _findEndItem(d){
      for(let o of d.children){
        if(o._viewDef&&o._viewDef._endItem){
          return o
        }
      }
    }
  },
  _updateRepeatInObject:function(u,_data){
    if(_data&&_data.constructor==String){
      _data=[_data]
    }else if(_data&&_data.constructor==Number){
      _data=new Array(_data).fill(0)
    }
    var _tmpViewDef=_CtrlDriver._clone(u._viewDef);
    delete _tmpViewDef._dataRepeat;

    var _oth=0;
    var _insertMethod="append";
    var _othDom=null;
    while(u._dom.childNodes.length>_oth){
      var o=u._dom.childNodes[_oth];
      var _equal=false;
      try{
        _equal=JSON.stringify(o._viewDef)==JSON.stringify(_tmpViewDef);
      }catch(e){}
      if(_equal){
        _CtrlDriver._cleanDom(o);
      }else if(_oth){
        _othDom=o;
        _insertMethod="insertBefore";
        break
      }else{
        _oth++;
      }
    }

    for(var n in _data){
      var _dom=_CtrlDriver._drawView(u._ctrl,{_item:_data[n],_group:u._group,_supData:u._supData,_idx:n,_key:n},_tmpViewDef);
      if(_insertMethod=="append"){
        $(u._dom).append(_dom);
      }else{
        $(_dom).insertBefore(_othDom);
      }
    }
  },
  _repeatData:function(_ctrl,_data,_viewDef,_box,_point){
    _CtrlDriver._curDomItem={
      _dom:_box,
      _attr:"repeat",
      _time:Date.now(),
      _group:_viewDef._dataRepeat,
      _supData:_data,
      _ctrl:_ctrl,
      _viewDef:_viewDef
    };
    var value = _CtrlDriver._retrieveResult(_viewDef._dataRepeat,_data,_ctrl)||[];
    var _doms=[];
    if(value){
      if(value.constructor==Number){
        value=new Array(value).fill(0);
      }else if(value.constructor==String){
        value=[value]
      }
      var _tmpViewDef=_CtrlDriver._clone(_viewDef);
      delete _tmpViewDef._dataRepeat;
      for(var k in value){
        if($.isNumeric(k)){
          k=parseInt(k);
        }
        var o={
          _item:value[k],
          _group:_viewDef._dataRepeat,
          _supData:_data,
          _idx:k,
          _key:k,
          _groupValue:value
        }
        if(value.constructor==Array){
          o._size=value.length
        }

        _doms.push(_CtrlDriver._drawView(_ctrl,o,_tmpViewDef,_box,_point));
      }

      _CtrlDriver._curDomItem={
        _dom:_box,
        _attr:"repeat",
        _time:Date.now(),
        _group:_viewDef._dataRepeat,
        _supData:_data,
        _ctrl:_ctrl,
        _viewDef:_viewDef
      };
  
    }
    return _doms;
  },
  _drawView:function(_ctrl,_data,_viewDef,_box,_point){
    if(_viewDef._data){
      _data=_CtrlDriver._retrieveResult(_viewDef._data,_data,_ctrl);
    }

    _CtrlDriver._initUIBind(_ctrl,_data,_viewDef);
    if(_viewDef._if!==undefined && !_CtrlDriver._updateIf()){
      if(_point){
        $(_CtrlDriver._curDomItem._dom).insertAfter(_point);
      }else{
        $(_box).append(_CtrlDriver._curDomItem._dom);
      }
      return;
    }
    if(_viewDef._dataRepeat){
      return _CtrlDriver._repeatData(_ctrl,_data,_viewDef,_box);
    }
    var _dom=null;
    if(_viewDef._tag){
      _dom=_CtrlDriver._updateDom(_CtrlDriver._curDomItem,_data);
    }else if(_viewDef._load){
      _dom=_CtrlDriver._loadContent();
    }else if(_viewDef._html){
      _dom=_CtrlDriver._updateHtml();
    }else if(_viewDef._text){
      _dom=_CtrlDriver._updateText();
    }
    if(_viewDef._dragOrder){
      _CtrlDriver._setDragOrder(_dom,_viewDef._dragOrder)
    }
    if(_point){
      $(_dom).insertAfter(_point);
    }else if(_box){
      $(_box).append(_dom);
      _CtrlDriver._attachEnable(_box,_dom)
    }

    return _dom;
  },
  _attachEnable:function(_box,_dom,_enable,_disabled){
    if(_box._viewDef&&((_enable!==undefined||_disabled!==undefined)||(_box._viewDef._attr&&_box._viewDef._attr.enable)||$(_box).attr("enable"))){
      if(_enable===undefined&&_disabled===undefined){
        _enable=$(_box).attr("enable")
        _disabled=$(_box).attr("disabled")
      }
      _enable=(_disabled?0:_enable)&&true
      if(_dom){
        if(_dom.tagName){
          _doDom(_dom,_enable,_disabled)
        }
      }else{
        for(let o of _box.children){
          _doDom(o,_enable,_disabled)
        }
      }
    }

    function _doDom(o,_enable,_disabled){
      if(o._viewDef){
        if($(o).attr("disabled")||(o._viewDef._attr&&o._viewDef._attr.enable)||$(o).attr("enable")==_enable){
        }else{
          // if(!_enable){
          //   debugger
          // }
          $(o).attr("enable",_enable)
          _CtrlDriver._attachEnable(o,0,_enable,_disabled)
        }
      }
    }
  },
  _setDragOrder:function(_dom,_dragOrder,_retry){
    _retry=_retry||0
    let p=_dragOrder._getBox?_dragOrder._getBox(_dom):_dom.parentElement
    if(!p){
      if(_retry>100){
        return
      }
      return setTimeout(()=>{
        _CtrlDriver._setDragOrder(_dom,_dragOrder,_retry+1)
      },10)
    }
    if(p._dragOrder){
      _dragOrder=p._dragOrder
    }else{
      p._dragOrder=_dragOrder
    }
    $(_dom).css({cursor:"move"})
    _dom.droppable=true
    _dom.draggable=true
    _dom.ondragover=function(e){
      if(_dragOrder._if){
        if(!_dragOrder._if()){
          retrn
        }
      }
      if(_dragOrder._curElement){
        e.preventDefault();
        let os=_dragOrder._curElement.parentElement.children
        _setDragInsertPosMark(os[os.length-1])
        _dragOrder._curOver=this
        if(this!=_dragOrder._curElement){
          for(o of os){
            if(o==this){
              this._insert="top"
              break
            }else if(o==_dragOrder._curElement){
              this._insert="bottom"
              break
            }
          }
          _setDragInsertPosMark(this,this._insert)
        }
      }
    }
    _dom.ondragstart=function(e){
      if(_dragOrder._if){
        if(!_dragOrder._if()){
          retrn
        }
      }
      _dragOrder._curElement=this
      _dragOrder._curItem=_getItemData(this)
      
      if(!p.droppable){
        p.droppable=true
        p.ondragend=function(){
          if(_dragOrder._curElement){
            let _list = _getListData();
            let _idx=_list.indexOf(_dragOrder._curItem)
            if(_idx<_list.length-1){
              _list.splice(_idx,1)
              _list.push(_dragOrder._curItem)
              _dragOrder._after&&_dragOrder._after()
            }
          }
        }
        p.ondragover=function(e){
          if(_dragOrder._curElement&&!_dragOrder._curOver){
            e.preventDefault()
            let os=_dragOrder._curElement.parentElement.children
            _setDragInsertPosMark(os[os.length-1],"bottom")
          }
        }
      }
    }
    _dom.ondragend=function(e){
      if(_dragOrder._if){
        if(!_dragOrder._if()){
          retrn
        }
      }
      console.log("dom - ondragend")

      let _list = _getListData();
      let _item1=_dragOrder._curItem
      if(!_dragOrder._curOver){
        return
      }
      let _item2=_getItemData(_dragOrder._curOver)
      e.preventDefault();
      _dragOrder._curElement=0
      if(_item1==_item2){
        _setDragInsertPosMark(this)
        return
      }
      let _idx=_list.indexOf(_item1)
      _list.splice(_idx,1)
      _idx=_list.indexOf(_item2)
      
      if(_dragOrder._curOver._insert=="top"){
        _list.splice(_idx,0,_item1)
      }else{
        _list.splice(_idx+1,0,_item1)
      }
      if(_list&&_list[0]&&$.isNumeric(_list[0].idx)){
        _list.forEach((x,i)=>{
          x.idx=i
        })
      }
      _setDragInsertPosMark(this)
      _dragOrder._curElement=0
      _dragOrder._after&&_dragOrder._after()
    }
    _dom.ondragleave=function(e){
      _setDragInsertPosMark(this)
    }
    
    function _getListData(){
      return _dragOrder._getListData.constructor==Function?_dragOrder._getListData():_dragOrder._getListData
    }
    
    function _getItemData(o){
      return _dragOrder._getItemData?_dragOrder._getItemData():o._data._item
    }
    function _setDragInsertPosMark(o,t){
      if(!o._topBorder){
        o._topBorder=$(o).css("border-top")
        o._bottomBorder=$(o).css("border-bottom")
      }
      
      $(o).css({"border-top":o._topBorder,"border-bottom":o._bottomBorder})
      _dragOrder._curOver=0
      if(t){
        _dragOrder._curOver=o
        let d={}
        d["border-"+t]="2px dotted var(--active-color)"
        $(o).css(d)
      }
    }
  },
  _fillAttrs:function(_viewDef,_data,_ctrl){
    var _html="";
    var _orgValue=null;
    if(_viewDef._attr){
      for(var k in _viewDef._attr){
        /*
        for event, if value include '"', example:
        to get: onclick="alert(\"1\")", set like: onclick:"alert(\\\"1\\\")"
        to get: onclick="alert(\"abc' xyz\")", set like: onclick:"alert(\\\"abc' xyz\\\")"
        */
        var m=k.match(/^on[a-z]+/);
        var v=_viewDef._attr[k];
        if(!m || m[0]!=k || v.constructor!==String){
          _CtrlDriver._curDomItem={_dom:_CtrlDriver._curDomItem._dom,_attr:"['_attr']['"+k+"']"};
          if(!v){
          }
          v=_CtrlDriver._retrieveResult(v,_data,_ctrl);
          if(v===undefined){
            continue
          }
          v=v===null?"":v;
          if(["disabled","readonly","required","selected","checked","draggable","droppable","enable"].indexOf(k)>=0){
            if(v){
              _html+=" "+k+"=\"true\"";
            }
            // if(k=="enable"&&_html.includes("bz-action-list-content")){
            //   debugger
            // }
            continue;
          }
        }
        if(v===null || (v && (v.constructor==Array || v.constructor==Object))){
          _orgValue=v;
          v=_CtrlDriver._tmpValue++;
        }
        if(v.includes){
          if(!v.includes('"')){
            v='"'+v+'"';
          }else if(!v.includes("'")){
            v="'"+v+"'";
          }else{
            v='"'+v.replace(/"/g,"&quot;")+'"';
          }
        }else{
          v='"'+v+'"';
        }
        _html+=" "+k+"="+v;
      }
      
      var _tag=_CtrlDriver._retrieveResult(_viewDef._tag,_data,_ctrl);
      if(_tag.toLowerCase()=="input" && !_viewDef._attr.type){
        _html+=" type=\"text\"";
      }
    }
    if(_orgValue){
      return {_orgValue:_orgValue,_html:_html};
    }
    return _html;
  },
  _bindJqExt:function(_jqext,_jq,_data){
    if(_jqext){
      if(_jqext.constructor==String){
        _jqext=eval(_jqext)
      }
      _jq=$(_jq);
      for(var k in _jqext){
        if(!_jqext[k]){
          continue
        }
        if(_jqext[k].constructor==String){
          eval("_jqext[k]="+_jqext[k]);
        }
        
        if($.isArray(_jqext[k])){
          _jq[k](_jqext[k][0],_jqext[k][1]);
        }else{
          if(["BUTTON","INPUT","TEXTAREA","SELECT"].includes(_jq[0].tagName)&&["click","mousedown","dbclick"].includes(k)){
            _jq[0]["bzEvent"+k]=_jqext[k];
            _jq[k](function(a,b,c){
              if($(this.ownerDocument).find("[disabled]").find(this).length){
                if(!$(this).attr("enable")){
                  a.stopPropagation();
                  a.preventDefault();
                  return
                }
              }
              this["bzEvent"+a.type](a,b,c)
            })
          }else{
            _jq[k](_jqext[k]);
          }
        }
      }
    }
  },
  _isFunction:function(s){
    if(s&&s.constructor==String){
      s=s.trim()
      return s.match(/^\(?(function|\([^\)]*\) *=> *)/)
    }
  },
  _simpleClone:function(o){
    if(o){
      let n={}
      if(o.constructor==Array){
        n=[]
      }else if(o.cloneNode){
        return o.cloneNode()
      }else if(o.constructor!=Object){
        return o
      }

      for(var k in o){
        n[k]=o[k]
      }
      return n
    }
    return o
  },
  _sign:/[^\$\_\-\wÀ-Üà-øoù-ÿŒœ\u4E00-\u9FCC]+/,
  _setBZCommonBehavior:function(jq){
    // if(jq.tagName=="TEXTAREA"
    //   ||(jq.tagName=="INPUT" && (!jq.type || !["checkbox","button","radio"].includes(jq.type)))
    //   ||$(jq).hasClass("ai-select")){
    //   $(jq).mouseup(function(e){
    //     let o=e.target
    //     setTimeout(()=>{
    //       let aa=o._ctrlSelectionStart||0,
    //           bb=o._ctrlSelectionEnd||0,
    //           a=o.selectionStart,
    //           b=o.selectionEnd,
    //           _sel,_range,ac,bc,aac,bbc

    //       if(!["INPUT","TEXTAREA"].includes(e.target.tagName)){
    //         _sel = window.getSelection();
    //         _range = _sel.getRangeAt(0);

    //         a=_range.startOffset
    //         b=_range.endOffset
    //         ac=_range.startContainer
    //         bc=_range.endContainer
    //         aac=o._ctrlContainerStart
    //         bbc=o._ctrlContainerEnd
    //       }
              
    //       if(a==b&&(ac==bc)&&(ac!=aac||aa>a||bb<a)){
    //         let _word=_range?_Util._getElementContentText(_range.startContainer):o.value
    //         if(!_word){
    //           return
    //         }
    //         if(a==_word.length){
    //           a--
    //           b--
    //         }
    //         for(let i=a;i>=0;i--){
    //           let c=_word[i]
    //           if(!c){
    //             break
    //           }
    //           if(!c.match(_CtrlDriver._sign)){
    //             a=i
    //           }else{
    //             break
    //           }
    //         }
    //         for(let i=a;i<_word.length;i++){
    //           let c=_word[i]
    //           if(!c){
    //             break
    //           }
    //           if(!c.match(_CtrlDriver._sign)){
    //             b=i+1
    //           }else{
    //             break
    //           }
    //         }

    //         if(!_range){
    //           if(a!=b){
    //             o.selectionStart=a
    //             o.selectionEnd=b
    //           }else{
    //             a=o.selectionStart
    //             b=o.selectionEnd
    //           }
    //         }else{
    //           if(a!=b){
    //             _range.setStart(_range.startContainer, a);
    //             _range.setEnd(_range.endContainer, b);
    //           }else{
    //             a=o._ctrlSelectionStart
    //             b=o._ctrlSelectionEnd
    //           }
    //         }
    //       }
    //       if(_range){
    //         o._ctrlSelectionStart=a
    //         o._ctrlSelectionEnd=b
    //         o._ctrlContainerStart=ac
    //         o._ctrlContainerEnd=bc
    //       }else{
    //         o._ctrlSelectionStart=o.selectionStart
    //         o._ctrlSelectionEnd=o.selectionEnd
    //       }
    //     })
    //   });
    // }
  },
  _cleanFromData:function(_data){
    var _count=0;
    var _clean=0;
    if(_data && _data._uiMap){
      for(var k in _data._uiMap){
        var _uiList=_data._uiMap[k];
        for(var i=0;i<_uiList.length;i++){
          var u=_uiList[i];
          _count++;
          if(!u._dom || !u._dom.parentElement){
            _uiList.splice(i,1);
            _clean++;
            i--;
          }
        }
        var _result=_CtrlDriver._cleanFromData(_data[k]);
        _count+=_result._count;
        _clean+=_result._clean;
      }
    }
    return {_count:_count,_clean:_clean};
  },
  _clone:function(o){
    if($.type(o)=="array"){
      return $.extend(true,[],o);
    }else if($.type(o)=="object"){
      return $.extend(true,{},o);
    }
    return o;
  },
  _equalObj:function(o1,o2){
    if(o1==o2){
      return 1;
    }else if(!o1 || !o2){
      return 0;
    }
    o1=JSON.stringify(o1);
    o2=JSON.stringify(o2);
    if(o1==o2){
      return 1;
    }else if(o1.constructor!==String || o2.constructor!==String || o1.length!=o2.length){
      return 0;
    }
    o1=JSON.parse(o1);
    o2=JSON.parse(o2);
    return this._sortJson(o1)==this._sortJson(o2);
  },
  _sortJson:function(d,_ignoreNull,tab){
    if(!tab){
      tab="";
    }
    var _result="";
    if(d && d.constructor==Object){
      var _keys=[];
      for(var k in d){
        if(d[k]===undefined || (_ignoreNull && !d[k] && d[k]!==0 && d[k]!==false)){
          continue;
        }
        _keys.push(k);
      }
      _keys.sort();
      _result=tab+"{\n"
      for(var i=0;i<_keys.length;i++){
        k=_keys[i];
        _result+=tab+"  \""+k+"\":"+this._sortJson(d[k],_ignoreNull,tab+"  ");
        if(i<_keys.length-1){
          _result+=",\n";
        }else{
          _result+="\n";
        }
      }
      _result+=tab+"}";
    }else if(d && d.constructor==Array){
      _result=tab+"[\n"
      for(var k in d){
        _result+=this._sortJson(d[k],_ignoreNull,tab+" ");
        if(k<d.length-1){
          _result+=",\n";
        }else{
          _result+="\n";
        }
      }
      _result+=tab+"]";
    }else{
      _result=JSON.stringify(d);
    }
    return _result;
  },
  _setupKeyInput:function(_doc){
    _doc=_doc||document
    $(_doc).ready(function(){
      $(_doc.body).on("keydown",".bz-key-input",function(e){
        let m=_Util._matchAllSign
        if(event.key&&m.test(event.key)){
          event.preventDefault();
        }
      });
      $(_doc.body).on("keyup",".bz-key-input",function(e){
        if(!this._chInput&&this.value.match(_Util._matchAllSign)){
          this.value=this.value.replace(_Util._matchAllSign,"")
        }
      });
      $(_doc.body).on("compositionstart",".bz-key-input",function(e){
        this._chInput=1
      });
      $(_doc.body).on("compositionend",".bz-key-input",function(e){
        this._chInput=0
        this.value=this.value.replace(_Util._matchAllSign,"")
      });
      $(_doc.body).on("keydown",".bz-name-input",function(e){
        let m=/[0-9a-z-\._]/i
        if (!m.test(event.key)) {
          event.preventDefault();
        }
      });
      $(_doc.body).on("keyup",".bz-name-input",function(e){
        this.value=this.value.replace(/[^0-9a-z-\._]/ig,"")
      });
    
      $(_doc.body).on("keyup",".bz-name-input",function(e){
        this.value=this.value.replace(/[^0-9a-z-\._]/ig,"")
      });
  
      $(_doc.body).on("focus","input,select,textarea,[contenteditable]",function(e){
        if($(this).attr("enable")){
          return
        }
        if($(_doc).find("[disabled]").find(this).length){
          this.blur()
        }
      });
      $(_doc.body).on("mousedown","INPUT,SELECT,TEXTAREA,BUTTON,LABEL",function(e){
        if($(_doc).find("[disabled]").find(this).length){
          if($(this).attr("enable")){
            return
          }

          e.stopPropagation();
          e.preventDefault();
          let o=this
          o.disabled=true
          $(o).find("input,select,textarea,[contenteditable],button").attr("disabled",true)
          setTimeout(()=>{
            o.disabled=false
            $(o).find("input,select,textarea,[contenteditable],button").attr("disabled",false)
          },3000)
          return false;
        }
      });
  
      // $(_doc.body).on("click","*",function(e){
      //   if($(_doc).find("[disabled]").find(this).length){
      //     e.stopPropagation();
      //     if($(this).attr("enable")){
      //       return
      //     }
      //     e.preventDefault();
      //     return false;
      //   }
      // });
    })
  },
  _getResizePanelElement:function(_triggerFun,_panel,_offset,_fun){
    return {
      _tag:"span",
      _after:function(o,i){
        _resize()
        function _resize(){
          setTimeout(()=>{
            if(_fun){
              return _fun(o)
            }
            let w=o.ownerDocument.defaultView.innerHeight
            let ro=$(o.ownerDocument).find(_panel)[0]
            let r=ro.getBoundingClientRect()
            if(r.top>=w){
              return _resize()
            }
            $(ro).css({height:`calc(100% - ${r.top+_offset}px)`})
          })
        }
      },
      _attr:{
        style:function(d,c,o){
          _triggerFun(d)
          if(o){
            o._viewDef._after(o)
          }
          return "visibility:hidden;"
        }
      }
    }
  }
};
_CtrlDriver._setupKeyInput()
