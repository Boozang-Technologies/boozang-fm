var _CtrlDriver={
  _tmpValue:0,
  _curDomItem:null,
  _curSignedList:[],
  _updateUIList:[],
  _cleanList:[],
  _refershDataList:[],
  _arrayUIList:[],
  _proxyTypes:[Location,Object,Array],
  _isProxibleObj:function(o){
    return o && !o._isBZProxy && _CtrlDriver._proxyTypes.indexOf(o.constructor)>=0;
  },
  _mergeData:function(_from,_to){
    for(var k in _from){
      _to[k]=_from[k]
    }
  },
  _replaceData:function(_from,_to){
    _CtrlDriver._mergeData(_from,_to);
    for(var k in _to){
      if(_from[k]!=_to[k]){
        _to[k]=undefined;
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
  _buildProxy:function(_data,_parent,_name){
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

            if(this._uiMap[name]){
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
            if(this._uiMap && this._uiMap[name] && _CtrlDriver._updateUIList.indexOf(this._uiMap[name])<0){
              _CtrlDriver._updateUIList.push(this._uiMap[name]);
              _CtrlDriver._exeUpdateUI();
            }else if(this._parent){
              if(this._parent._uiMap[this._name]){
                _CtrlDriver._updateUIList.push(this._parent._uiMap[this._name]);
                _CtrlDriver._exeUpdateUI();
              }
            }
            if(_CtrlDriver._rootUpdateMap){
              _CtrlDriver._updateUIList.push(_CtrlDriver._rootUpdateMap);
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
                _CtrlDriver._cleanList.push(value._uiMap[k]);
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
    for(var i=0;i<_uiList.length;i++){
      var u=_uiList[i];
      if(u._dom.parentNode){
        if(_timer && u._time>_timer){
//          _ignore++;
          continue;
//        Don't remove the comment for chrome debug modal!!!
        }
//        _exe++;
        try{
          _CtrlDriver._curSignedList=[];
          _CtrlDriver._updateCount++;
          _CtrlDriver._curDomItem=u;
          if(u._attr=="_if"){
            _CtrlDriver._updateIf(u);
          }else if(u._attr=="['load']"){
            _CtrlDriver._loadContent(u);
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
        _uiList.splice(i,1);
        i--;
      }
    }
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
            if(window.SERVER_HOST && window.SERVER_HOST.startsWith("/"+"/localhost")){
              _result=_exe;
            }else if(window.BZM && location.host.startsWith("localhost")){
              _result=_exe;
            }
          }
        }
      }
    }catch(ee){
      if(!ee.message || (!ee.message.endsWith("of null") && !ee.message.endsWith("of undefined"))){
        console.error(ee);
      }
    }
    
    return _result;
  },
  //triggered on get data attributes
  _bindUI:function(_uiList){
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
      _CtrlDriver._cleanList.push(_uiList);
      _CtrlDriver._exeCleanList();
    }
  },
  //triggered on set data attributes
  _cleanDom:function(_dom){
    $(_dom).remove();
    while(_dom.childNodes.length){
      _CtrlDriver._cleanDom(_dom.childNodes[0]);
    }
  },
  _cleanData:function(_data){
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
      _CtrlDriver._curCleanListTimeout=setTimeout("_CtrlDriver._exeCleanList(1)",1);
      return;
    }
    var _timer=Date.now();
    var _count=0;
    var _chk=0;
    var _item=0;
    while(_CtrlDriver._cleanList.length){
      var _uiList=_CtrlDriver._cleanList.shift();
      var _tmpList=[];
      var _tmpAttrList=[];
      _item++;
      for(var i=0;i<_uiList.length;i++){
        var u=_uiList[i];
        _chk++;
        
        var ii=_uiList.indexOf(u);
        if(ii>=0 && ii!=i){
          _uiList.splice(i,1);
          _count++;
          i--;
        }else if((!u._dom.parentNode || !u._dom.ownerDocument || !u._dom.ownerDocument.defaultView) && u._time<_timer){
          _uiList.splice(i,1);
          _count++;
          i--;
        }else if(_tmpList.indexOf(u._dom)<0){
          _tmpAttrList.push([u._attr]);
          _tmpList.push(u._dom);
        }else{
          var _idx=_tmpList.indexOf(u._dom);
          if(u._attr=="repeat" || _tmpAttrList[_idx].indexOf(u._attr)<0){
            _tmpAttrList[_idx].push(u._attr);
          }else{
            _uiList.splice(i,1);
            i--;
            _count++;
          }
        }
      }
    }
  },
  _exeUpdateUI:function(_lanuch){
    if(!_lanuch){
      if(_CtrlDriver._curUIUpdateTimeout){
        clearTimeout(_CtrlDriver._curUIUpdateTimeout)
      }
      _CtrlDriver._curUIUpdateTimeout=setTimeout("_CtrlDriver._exeUpdateUI(1)",1);
      return;
    }
    var _timer=Date.now();
    _CtrlDriver._updateCount=0;
    var ul=[];
    while(_CtrlDriver._updateUIList.length){
      var _uiList=_CtrlDriver._updateUIList.shift();
      for(var i=0;i<_uiList.length;i++){
        var u=_uiList[i];
        if(ul.indexOf(u)<0){
          ul.push(u);
        }
      }
      _CtrlDriver._cleanList.push(_uiList);
    }
    _CtrlDriver._updateDataUI(ul,_timer);
    _CtrlDriver._exeCleanList();

    _CtrlDriver._curDomItem=null;
    _CtrlDriver._curSignedList=[];
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
      if(_viewDef._formatGet){
        _value=_viewDef._formatGet(_value,_data);
      }
      if(_value===undefined || _value===null){
        _value="";
      }
      _value=_value.toString();
      if(u._dom.type && u._dom.type.toLowerCase()=="checkbox"){
        u._dom.checked=_value==u._dom.value;
      }else if(u._dom.type && u._dom.type.toLowerCase()=="radio"){
        u._dom.checked=$(u._dom).val()==_value;
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
        var _focus=$("*:focus")[0]==u._dom;
        if(!_focus){
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
          u._dom.style[r[0]]=r[1];
        }
      }
    }else if(u._attr=="['_attr']['class']"){
      u._dom.className=_result;
    }else{
      var _attr=u._attr.split("]['")[1].split("'")[0];
      if(["disabled","readonly","checked","selected"].includes(_attr)){
        _result=Boolean(_result)
      }
      if(_attr=="value"){
        u._dom.value=_result;
      }else{
        $(u._dom).attr(_attr,_result);
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
    if(_ajax.constructor==Function || _ajax.constructor==String){
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
          _dom._viewDef=dd;
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
            $(_dom._resultDom).remove();
          }
          $(dd).insertAfter(_dom);
          _dom._resultDom=dd;
          return dd;
        }else{
          $(_dom).replaceWith(dd);
        }
      }
    }
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
    if(u){
      _CtrlDriver._curDomItem=u;
    }else{
      _CtrlDriver._curDomItem={_dom:_CtrlDriver._curDomItem._dom,_attr:"['text']"};
    }
    var _doc=_CtrlDriver._curDomItem._dom._ctrl._document || document;
    
    var _dom=_CtrlDriver._curDomItem._dom;
    var _tmp=_CtrlDriver._retrieveResult(_dom._viewDef._text,_dom._data,_dom._ctrl);
    if(_tmp===null || _tmp===undefined){
      _tmp="";
    }
    _CtrlDriver._curDomItem._dom.textContent=_tmp;
    _CtrlDriver._replaceBindDom(null,"['text']",true);
    return _dom;
  },
  _updateRebuild:function(u){
    var _box=u._dom.parentNode;
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
    var _value = _CtrlDriver._retrieveResult(_dom._viewDef._if,_dom._data,_dom._ctrl);
    
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
              _toHide();
            });
          }else{
            _CtrlDriver._animationHideAll(u._dom,function(){
              _toHide();
            });
          }
        }else{
          _toHide();
        }
        function _toHide(){
          $(u._dom).replaceWith(_tmp);
          _CtrlDriver._cleanDom(u._dom);
          u._dom=_tmp;
        }
        return;
      }
    }else if(u && (u._dom.nodeType!=_dom.nodeType || u._dom.textContent)){
      return;
    }else if(!u){
      return _CtrlDriver._curDomItem;
    }
    if(u._dom._viewDef._dataRepeat){
      _CtrlDriver._repeatData(u._dom._ctrl,u._dom._data,u._dom._viewDef,u._dom.parentNode,u._dom);
      _CtrlDriver._cleanDom(u._dom);
    }else{
      _dom=_CtrlDriver._updateDom(u);
      var _doAnimation=((_dom._viewDef._animation && _dom._viewDef._animation._show) || _CtrlDriver._animationShowAll) && (!_dom._viewDef._animation || _dom._viewDef._animation._show!="none");
      if(_doAnimation && _dom.tagName){
        _dom.style.display="none";
      }
      $(u._dom).replaceWith(_dom);
      if(_doAnimation && _dom.tagName){
        if(_dom._viewDef._animation && _dom._viewDef._animation._show){
          _dom._viewDef._animation._show(_dom);
        }else if(_CtrlDriver._animationShowAll){
          _CtrlDriver._animationShowAll(_dom);
        }
      }
    }
  },
  _buildDom:function(u){
    u=u._dom;
    var _data=u._data;
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
    
    return _dom;
  },
  _updateDom:function(u){
    var _dom=_CtrlDriver._buildDom(u);
    
    _CtrlDriver._replaceBindDom(_dom,null,true);
    
    _CtrlDriver._bindJqExt(_dom._viewDef._jqext,_dom);
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
    
    if(_dom._viewDef._items){
      var _items=_dom._viewDef._items;
      if(_items.constructor==String || _items.constructor==Function){
        _items=_CtrlDriver._retrieveResult(_items,_dom._data,_dom._ctrl,_dom);
      }
      for(var i=0;i<_items.length;i++){
        var r=_items[i];
        _CtrlDriver._drawView(_dom._ctrl,_dom._data,r,_dom);
      }
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
      if(["INPUT","SELECT","TEXTAREA"].indexOf(_tag.toUpperCase())>=0){
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
        $(_dom).on(_event,function(){
          _CtrlDriver._typingBox=this;
          var _data=this._data;
          var _bind=this._viewDef._dataModel;
          if(_bind.constructor==Function){
            _bind=_bind(_data)
          }
          if(this.type=="checkbox"){
            if(this.checked){
              eval(_bind+"=this.value");
            }else{
              eval(_bind+"=null");
              eval("delete "+_bind);
            }
          }else{
            var _value=null;
            if(this._viewDef._dataType==Number){
              _value=parseFloat(this.value);
              if(!_value){
                _value=0;
              }
            }else{
              _value=this.value;
            }
            if(this.tagName=="SELECT"){
              if(this.selectedOptions[0]._orgValue){
                _value=this.selectedOptions[0]._orgValue;
              }
            }
            if(this._viewDef._formatSet){
              _value=this._viewDef._formatSet(_value,_data);
            }
            eval(_bind+"=_value");
          }
        });
        $(_dom).on("blur",function(){
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
            _dom.checked=_dom.value+""==(_value?_value+"":"");
          }else if(type=="radio"){
            _dom.checked=_dom.value==(_value?_value+"":"");
          }else{
            if(_dom._viewDef._formatGet){
              _value=_dom._viewDef._formatGet(_value,_data);
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
        }catch(e){_CtrlDriver._handleError(e);}
        
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
          }
        },10);
      }
    }
    _CtrlDriver._curSignedList=[];
    return _dom;
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
  },
  _updateRepeatInArray:function(u,_data){
    var _idx=0;
    var _last=null;
    for(var i=0;i<u._dom.childNodes.length;i++){
      var o=u._dom.childNodes[i];
      if(o._data && o._data._group==u._group && o._data._supData==u._supData){
        if(!$.isNumeric(o._data._idx)){
          _CtrlDriver._cleanDom(o);
          continue;
        }else if(o._data._idx==_idx){
          _last=o;
          if(!_data || _idx>=_data.length){
            _CtrlDriver._cleanDom(o);
            i--;
          }else if(o._data._item!=_data[_idx]){
            try{
              if(JSON.stringify(o._data._item)==JSON.stringify(_data[_idx])){
                if(_CtrlDriver._typingBox && $(o).find(_CtrlDriver._typingBox).length){
                  return;
                }
              }
            }catch(e){}
            o._data._item=_data[_idx];
            var _dom=_CtrlDriver._drawView(o._ctrl,o._data,o._viewDef);
            $(o).replaceWith(_dom);
            _CtrlDriver._cleanDom(o);
            _last=_dom;
          }
        }
        _idx++;
      }else if(_idx){
        break;
      }
    }

    var _tmpViewDef=_CtrlDriver._clone(u._viewDef);
    delete _tmpViewDef._dataRepeat;
    for(var n=_idx;_data && n<_data.length;n++){
      var _dom=_CtrlDriver._drawView(u._ctrl,{_item:_data[n],_group:u._group,_supData:u._supData,_idx:n,_key:n},_tmpViewDef);
      if(_last){
        $(_dom).insertAfter(_last);
      }else{
        $(u._dom).append(_dom);
      }
      _last=_dom;
    }
  },
  _updateRepeatInObject:function(u,_data){
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
        _insertMethod="append"
      }else{
        _oth++;
        _othDom=o;
        _insertMethod="insertBefore";
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
    _CtrlDriver._curDomItem={_dom:_box,_attr:"repeat",_time:Date.now(),_group:_viewDef._dataRepeat,_supData:_data,_ctrl:_ctrl,_viewDef:_viewDef};
    var value = _CtrlDriver._retrieveResult(_viewDef._dataRepeat,_data,_ctrl);
    var _doms=[];
    if(value && value.constructor!=String){
      if(value.constructor==Number){
        value=new Array(value).fill(0);
      }
      var _tmpViewDef=_CtrlDriver._clone(_viewDef);
      delete _tmpViewDef._dataRepeat;
      for(var k in value){
        if($.isNumeric(k)){
          k=parseInt(k);
        }
        _doms.push(_CtrlDriver._drawView(_ctrl,{_item:value[k],_group:_viewDef._dataRepeat,_supData:_data,_idx:k,_key:k},_tmpViewDef,_box,_point));
        _CtrlDriver._curDomItem={_dom:_box,_attr:"repeat",_time:Date.now(),_group:_viewDef._dataRepeat,_supData:_data,_ctrl:_ctrl,_viewDef:_viewDef};
      }
    }
    return _doms;
  },
  _drawView:function(_ctrl,_data,_viewDef,_box,_point){
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
      _dom=_CtrlDriver._updateDom(_CtrlDriver._curDomItem);
    }else if(_viewDef._load){
      _dom=_CtrlDriver._loadContent();
    }else if(_viewDef._html){
      _dom=_CtrlDriver._updateHtml();
    }else if(_viewDef._text){
      _dom=_CtrlDriver._updateText();
    }
    if(_point){
      $(_dom).insertAfter(_point);
    }else if(_box){
      $(_box).append(_dom);
    }
    return _dom;
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
          v=v===undefined?"":v;
          if(["disabled","readonly","selected","checked"].indexOf(k)>=0){
            if(v){
              _html+=" "+k+"=\"true\"";
            }
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
  _bindJqExt:function(_jqext,_jq){
    if(_jqext){
      var _data=_jq._data;
      _jq=$(_jq);
      for(var k in _jqext){
        if(_jqext[k].constructor==String){
          eval("_jqext[k]="+_jqext[k]);
        }
        
        if($.isArray(_jqext[k])){
          _jq[k](_jqext[k][0],_jqext[k][1]);
        }else{
          _jq[k](_jqext[k]);
        }
      }
    }
  },
  _setBZCommonBehavior:function(jq){
    if(jq.tagName=="INPUT" && (!jq.type || jq.type=="text")){
      $(jq).focus(function(){
        this.select();
      });
    }
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
          if(!u._dom || !u._dom.parentNode){
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
  }
};
