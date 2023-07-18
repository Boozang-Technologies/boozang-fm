# boozang-fm

## Introduction

The Boozang framework is a lightweight, Open-Source Javascript framework based on JSON. It has a simple templating engine and supports two-way databinding.  

## Usage

To try out the Boozang Javascript framework, simply link `jQuery` and the Boozang framework CtrlDriver (https://github.com/ljunggren/boozang-fm/blob/master/js/CtrlDriver.js) in the `<head></head>` element of your HTML file.

```
<script src="/js/CtrlDriver.js"></script>
<script src="/js/jquery-3.1.1.min.js"></script>
```
The HTML is dynamically built inside the script tag, so use the following syntax

```
<html>
<script src="/js/CtrlDriver.js"></script>
<script src="/js/jquery-3.1.1.min.js"></script>
<script>

  //The module, a, could be in a js file and insert by script tag
  var a={
    //_CtrlDriver._buildProxy is the function to bind data on UI
    data:_CtrlDriver._buildProxy({list:[],map:{firstName:"wensheng",lastName:"Li"}}),
    init:function(){
      //To generate UI
      _CtrlDriver._execute(this, this.data, this.viewDef,$('#lws')[0]);
    },
    viewDef:{
      _tag:"div",

...
</script>
<body>
  boozang key words:<br/> 
  <b>
    _tag *,<br/> 
    _attr (collection of element html attributes *),<br/> 
    _text *,<br/> 
    _html *,<br/> 
    _jqext (collection of event function),<br/> 
    _items (collection of sub-element),<br/> 
    _if *,<br/> 
    _dataModel *,<br/> 
    _dataRepeat * (_data, _item, _idx, _key, _supData),<br/> 
    _formatGet **,<br/> 
    _formatSet **,<br/> 
    _load *,<br/> 
    _focus *,<br/>
    _animation (_show, _hide)</b><br/><br/>
    Note: <br/>
    * supports function and expression (text and databind)<br/>
    ** supports function only <br/><br/>
    Examples:
    <hr>
  </b>
  <div id='lws' style='background-color: yellow'></div>
</body>
</html>

```
## Running the example page

The easiest way to get started is to run the example page, which describes the different functions.

### Using npm (example with: http-server):

1. `git clone https://github.com/Boozang-Technologies/boozang-fm`
2. `cd boozang-fm`
3. `npm install --global http-server` (or any other web server)
5. `http-server --port 7000` (or any port)
6. Access `http://localhost:7000` to see example page

## Browser Requirements
Supports Chrome, Safari, Firefox, Opera, and Edge browsers. IE is not supported. 

## Keywords

14 keywords are supported currently

```javascript
_tag *
_attr (collection of element html attributes *)
_text *
_html *
_jqext (collection of event function)
_items (collection of sub-element)
_if *
_dataModel *
_dataRepeat * (_data, _item, _idx, _key, _supData)
_formatGet **
_formatSet **
_load *
_focus *
_animation (_show, _hide)
```

## Built With

* [jQuery](https://jquery.com/) - The Boozang framework is based on jQuery

## Authors

* **Wensheng Li** - *Initial work* - [lwshome](https://github.com/lwshome)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
