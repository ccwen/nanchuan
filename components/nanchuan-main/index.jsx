/** @jsx React.DOM */
/*
   SPEC : 
     檔名過慮功能。
     經號速查功能。
     頁碼速查功能。taisho page, pts page 

     相似句搜尋  , 取出 caret 所在句子， 進行模糊搜尋。( 精確和相似結果)

     前後文搜尋 context 統計 。前後1,2 字。  後面 1,2字。 ( time consuming , need a click)
        先用索引查出 可能頁 ( 濾去控制字元， - 排除 )，再送regular expression ，最後頻次統計。
     
     辭典搜尋。搜尋可能名詞。 先取句子。再從游標處做 prefix search ， 退後n字再找。

     對讀。   

*/   
var tofindExtra=function() {
  return <a href="#" onClick={this.dosearch}>給孤獨</a>
}
var Main = React.createClass({
  mixins:[Require("defaultmain")],
  tocTag:"mulu",
  defaultTofind:"正知",
  tofindExtra:tofindExtra,
  dbid:"nanchuan",
});
module.exports=Main;